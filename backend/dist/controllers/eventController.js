import { z } from "zod";
import { Event } from "../models/Event.js";
import { Invitation } from "../models/Invitation.js";
import { normalizePhone, sendEventCancelledSms, sendEventUpdatedSms } from "../utils/twilio.js";
const eventSchema = z.object({
    eventName: z.string().min(1, "Event name is required"),
    description: z.string().optional().default(""),
    eventDate: z.string().min(1, "Event date is required"),
    startTime: z.string().optional().default(""),
    endTime: z.string().optional().default(""),
    location: z.string().optional().default(""),
    notes: z.string().optional().default(""),
});
export async function listEvents(_req, res) {
    const events = await Event.find().sort({ eventDate: 1 }).lean();
    return res.json({ events });
}
export async function getEvent(req, res) {
    const event = await Event.findById(req.params.id).lean();
    if (!event) {
        return res.status(404).json({ message: "Event not found" });
    }
    return res.json({ event });
}
export async function createEvent(req, res) {
    const parsed = eventSchema.safeParse(req.body);
    if (!parsed.success) {
        return res
            .status(400)
            .json({ message: "Invalid input", errors: parsed.error.flatten().fieldErrors });
    }
    const event = await Event.create({
        ...parsed.data,
        eventDate: new Date(parsed.data.eventDate),
        createdBy: req.user?.sub,
    });
    return res.status(201).json({ event });
}
export async function updateEvent(req, res) {
    const parsed = eventSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        return res
            .status(400)
            .json({ message: "Invalid input", errors: parsed.error.flatten().fieldErrors });
    }
    const update = { ...parsed.data };
    if (parsed.data.eventDate)
        update.eventDate = new Date(parsed.data.eventDate);
    const existing = await Event.findById(req.params.id);
    if (!existing) {
        return res.status(404).json({ message: "Event not found" });
    }
    const event = await Event.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!event) {
        return res.status(404).json({ message: "Event not found" });
    }
    const invitations = await Invitation.find({ eventId: event._id }).populate("participantId", "firstName middleName lastName countryCode phoneNumber").lean();
    for (const invitation of invitations) {
        const participant = invitation.participantId;
        const phone = [participant?.countryCode, participant?.phoneNumber].filter(Boolean).join(" ").trim();
        const participantName = [participant?.firstName, participant?.middleName, participant?.lastName].filter(Boolean).join(" ").trim() || "Participant";
        if (!phone)
            continue;
        try {
            await sendEventUpdatedSms(`+${normalizePhone(phone)}`, participantName, event.eventName, new Date(event.eventDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
            }), event.location || "TBD", [event.startTime, event.endTime].filter(Boolean).join(" - ") || "TBD");
        }
        catch (err) {
            console.error("[twilio] update notification failed", err);
        }
    }
    return res.json({ event });
}
export async function deleteEvent(req, res) {
    const event = await Event.findById(req.params.id);
    if (!event) {
        return res.status(404).json({ message: "Event not found" });
    }
    const invitations = await Invitation.find({ eventId: event._id }).populate("participantId", "firstName middleName lastName countryCode phoneNumber").lean();
    for (const invitation of invitations) {
        const participant = invitation.participantId;
        const phone = [participant?.countryCode, participant?.phoneNumber].filter(Boolean).join(" ").trim();
        const participantName = [participant?.firstName, participant?.middleName, participant?.lastName].filter(Boolean).join(" ").trim() || "Participant";
        if (!phone)
            continue;
        try {
            await sendEventCancelledSms(`+${normalizePhone(phone)}`, participantName, event.eventName);
        }
        catch (err) {
            console.error("[twilio] cancellation notification failed", err);
        }
    }
    await Invitation.deleteMany({ eventId: event._id });
    await Event.findByIdAndDelete(req.params.id);
    return res.json({ message: "Event deleted" });
}
