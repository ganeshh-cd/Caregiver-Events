import { z } from "zod";
import { Event } from "../models/Event.js";
import { INVITATION_STATUS, Invitation } from "../models/Invitation.js";
import { User } from "../models/User.js";
import { normalizePhone, sendCancellationSms, sendInvitationSms, } from "../utils/twilio.js";
const createSchema = z.object({
    participantIds: z.array(z.string().min(1)).min(1, "Select at least one participant"),
});
/**
 * Create invitation records for the selected participants of an event.
 * New invitations default to PENDING. Already-invited participants are skipped.
 */
export async function createInvitations(req, res) {
    const { id: eventId } = req.params;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
        return res
            .status(400)
            .json({ message: "Invalid input", errors: parsed.error.flatten().fieldErrors });
    }
    const event = await Event.findById(eventId);
    if (!event) {
        return res.status(404).json({ message: "Event not found" });
    }
    const docs = parsed.data.participantIds.map((participantId) => ({
        eventId,
        participantId,
        status: INVITATION_STATUS.PENDING,
        invitedBy: req.user?.sub,
    }));
    // ordered:false so duplicates (unique index) are skipped without failing the batch.
    let created = 0;
    try {
        const result = await Invitation.insertMany(docs, { ordered: false });
        created = result.length;
    }
    catch (err) {
        created = err?.result?.insertedCount ?? err?.insertedDocs?.length ?? 0;
    }
    const participants = await User.find({ _id: { $in: parsed.data.participantIds } })
        .select("_id firstName middleName lastName countryCode phoneNumber")
        .lean();
    for (const participant of participants) {
        const phone = [participant.countryCode, participant.phoneNumber].filter(Boolean).join(" ").trim();
        if (!phone)
            continue;
        try {
            await sendInvitationSms(`+${normalizePhone(phone)}`, [participant.firstName, participant.middleName, participant.lastName]
                .filter(Boolean)
                .join(" ")
                .trim() || "Participant", event.eventName, new Date(event.eventDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
            }), event.location || "TBD", [event.startTime, event.endTime].filter(Boolean).join(" - ") || "TBD");
        }
        catch (err) {
            console.error("[twilio] invitation SMS failed", err);
        }
    }
    const total = await Invitation.countDocuments({ eventId });
    return res.status(201).json({
        message: `${created} invitation(s) created`,
        created,
        skipped: parsed.data.participantIds.length - created,
        totalForEvent: total,
    });
}
/** List invitations for an event with participant details. */
export async function listInvitations(req, res) {
    const { id: eventId } = req.params;
    const invitations = await Invitation.find({ eventId })
        .populate("participantId", "firstName middleName lastName email countryCode phoneNumber city")
        .sort({ createdAt: -1 })
        .lean();
    const data = invitations.map((inv) => {
        const p = inv.participantId ?? {};
        return {
            id: String(inv._id),
            status: inv.status,
            response: inv.response ?? null,
            responseDate: inv.responseDate ?? null,
            participant: {
                id: String(p._id ?? ""),
                name: [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ").trim() || "—",
                email: p.email ?? "",
                phone: [p.countryCode, p.phoneNumber].filter(Boolean).join(" ").trim(),
                city: p.city ?? "",
            },
        };
    });
    return res.json({ invitations: data });
}
export async function cancelInvitation(req, res) {
    const { eventId, invitationId } = req.params;
    const invitation = await Invitation.findOne({ _id: invitationId, eventId }).populate("participantId", "firstName middleName lastName countryCode phoneNumber");
    if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
    }
    const participant = invitation.participantId;
    const participantName = [participant?.firstName, participant?.middleName, participant?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
    await Invitation.deleteOne({ _id: invitationId, eventId });
    const phone = [participant?.countryCode, participant?.phoneNumber].filter(Boolean).join(" ").trim();
    if (phone) {
        try {
            await sendCancellationSms(`+${normalizePhone(phone)}`, participantName || "Participant", "this event");
        }
        catch (err) {
            console.error("[twilio] cancellation SMS failed", err);
        }
    }
    return res.json({ message: "Invitation cancelled", invitationId });
}
export async function listInvitationResponses(req, res) {
    const { eventId, response, search } = req.query;
    const filter = {};
    if (eventId)
        filter.eventId = eventId;
    if (response)
        filter.response = response;
    const query = Invitation.find(filter)
        .populate("participantId", "firstName middleName lastName email countryCode phoneNumber")
        .populate("eventId", "eventName eventDate")
        .sort({ responseDate: -1, createdAt: -1 })
        .lean();
    const invitations = await query;
    const data = invitations
        .filter((inv) => {
        if (!search)
            return true;
        const term = search.toLowerCase();
        const participant = inv.participantId ?? {};
        const event = inv.eventId ?? {};
        return [participant.firstName, participant.middleName, participant.lastName, participant.email, participant.phoneNumber, event.eventName]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(term);
    })
        .map((inv) => {
        const participant = inv.participantId ?? {};
        const event = inv.eventId ?? {};
        return {
            id: String(inv._id),
            participantName: [participant.firstName, participant.middleName, participant.lastName]
                .filter(Boolean)
                .join(" ")
                .trim(),
            phone: [participant.countryCode, participant.phoneNumber].filter(Boolean).join(" ").trim(),
            eventName: event.eventName ?? "",
            response: inv.response ?? "PENDING",
            responseDate: inv.responseDate ?? null,
        };
    });
    return res.json({ invitations: data });
}
