import type { Request, Response } from "express"
import { z } from "zod"
import { Event } from "../models/Event.js"
import { INVITATION_RESPONSE, INVITATION_STATUS, Invitation } from "../models/Invitation.js"
import { User } from "../models/User.js"
import { twilioService } from "../services/twilioService.js"
import { toE164 } from "../utils/phone.js"
import { buildInvitationMessage } from "../utils/smsTemplates.js"

const createSchema = z.object({
  participantIds: z.array(z.string().min(1)).min(1, "Select at least one participant"),
})

/** Format an event Date for display inside an SMS body. */
function formatEventDate(date: unknown): string {
  const d = date instanceof Date ? date : new Date(date as string)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

function participantName(p: any): string {
  return (
    [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(" ").trim() ||
    p?.preferredName ||
    "Participant"
  )
}

/**
 * Create invitation records for the selected participants of an event and
 * send each newly invited participant an SMS invitation (Phase 2).
 * Already-invited participants are skipped (no duplicate SMS).
 */
export async function createInvitations(req: Request, res: Response) {
  const { id: eventId } = req.params
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Invalid input", errors: parsed.error.flatten().fieldErrors })
  }

  const event = await Event.findById(eventId)
  if (!event) {
    return res.status(404).json({ message: "Event not found" })
  }

  const requestedIds = Array.from(new Set(parsed.data.participantIds))

  // Skip participants who already have an invitation for this event.
  const existing = await Invitation.find({
    eventId,
    participantId: { $in: requestedIds },
  })
    .select("participantId")
    .lean()
  const existingSet = new Set(existing.map((e: any) => String(e.participantId)))
  const newIds = requestedIds.filter((id) => !existingSet.has(id))

  if (newIds.length === 0) {
    const total = await Invitation.countDocuments({ eventId })
    return res
      .status(200)
      .json({ message: "All selected participants were already invited", created: 0, skipped: requestedIds.length, sent: 0, totalForEvent: total })
  }

  // Create the invitation records (PENDING).
  const insertedDocs = await Invitation.insertMany(
    newIds.map((participantId) => ({
      eventId,
      participantId,
      status: INVITATION_STATUS.PENDING,
      response: INVITATION_RESPONSE.PENDING,
      invitedBy: req.user?.sub,
    })),
  )

  // Look up the participants so we can address and text them.
  const participants = await User.find({ _id: { $in: newIds } })
    .select("firstName middleName lastName preferredName countryCode phoneNumber")
    .lean()
  const participantById = new Map(participants.map((p: any) => [String(p._id), p]))

  const eventDateText = formatEventDate(event.eventDate)
  let sent = 0

  // Send an SMS per new invitation and record the outbound status.
  await Promise.all(
    insertedDocs.map(async (inv: any) => {
      const p = participantById.get(String(inv.participantId))
      if (!p) return
      const to = toE164(p.countryCode, p.phoneNumber)
      const body = buildInvitationMessage({
        participantName: participantName(p),
        eventName: event.eventName,
        eventDate: eventDateText,
      })
      const result = await twilioService.sendSms({ to, body })
      if (result.status !== "failed") sent += 1
      await Invitation.updateOne(
        { _id: inv._id },
        { $set: { smsSid: result.sid, smsStatus: result.status } },
      )
    }),
  )

  const total = await Invitation.countDocuments({ eventId })
  return res.status(201).json({
    message: `${newIds.length} invitation(s) created, ${sent} SMS sent${
      twilioService.isConfigured() ? "" : " (simulated)"
    }`,
    created: newIds.length,
    skipped: requestedIds.length - newIds.length,
    sent,
    simulated: !twilioService.isConfigured(),
    totalForEvent: total,
  })
}

/** Map an invitation document to the API shape used by the frontend. */
function mapInvitation(inv: any) {
  const p = inv.participantId ?? {}
  return {
    id: String(inv._id),
    status: inv.status,
    response: inv.response ?? INVITATION_RESPONSE.PENDING,
    responseDate: inv.responseDate ?? null,
    participant: {
      id: String(p._id ?? ""),
      name: [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ").trim() || "—",
      email: p.email ?? "",
      phone: [p.countryCode, p.phoneNumber].filter(Boolean).join(" ").trim(),
      city: p.city ?? "",
    },
  }
}

/** List invitations for an event with participant details + response counts. */
export async function listInvitations(req: Request, res: Response) {
  const { id: eventId } = req.params
  const invitations = await Invitation.find({ eventId })
    .populate("participantId", "firstName middleName lastName email countryCode phoneNumber city")
    .sort({ createdAt: -1 })
    .lean()

  const data = invitations.map(mapInvitation)

  const counts = {
    total: data.length,
    PENDING: 0,
    YES: 0,
    SELF: 0,
    NO: 0,
  }
  for (const inv of data) {
    const key = inv.response as keyof typeof counts
    if (key in counts && key !== "total") counts[key] += 1
  }

  return res.json({ invitations: data, counts })
}

/**
 * Response-tracking feed (Phase 2). Returns one row per invitation with the
 * participant, event, response and response date. Supports filtering by
 * event, response value, and a free-text search over name/phone.
 */
export async function listResponses(req: Request, res: Response) {
  const eventId = String(req.query.eventId ?? "").trim()
  const responseFilter = String(req.query.response ?? "").trim().toUpperCase()
  const search = String(req.query.search ?? "").trim().toLowerCase()

  const query: Record<string, unknown> = {}
  if (eventId) query.eventId = eventId
  if (responseFilter && responseFilter in INVITATION_RESPONSE) query.response = responseFilter

  const invitations = await Invitation.find(query)
    .populate("participantId", "firstName middleName lastName countryCode phoneNumber")
    .populate("eventId", "eventName eventDate")
    .sort({ responseDate: -1, createdAt: -1 })
    .lean()

  let rows = invitations.map((inv: any) => {
    const p = inv.participantId ?? {}
    const e = inv.eventId ?? {}
    return {
      id: String(inv._id),
      participantName: participantName(p),
      phone: [p.countryCode, p.phoneNumber].filter(Boolean).join(" ").trim(),
      eventId: String(e._id ?? ""),
      eventName: e.eventName ?? "—",
      response: inv.response ?? INVITATION_RESPONSE.PENDING,
      responseDate: inv.responseDate ?? null,
    }
  })

  if (search) {
    rows = rows.filter(
      (r) =>
        r.participantName.toLowerCase().includes(search) ||
        r.phone.toLowerCase().includes(search),
    )
  }

  return res.json({ responses: rows })
}
