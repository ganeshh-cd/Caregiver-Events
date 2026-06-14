import type { Request, Response } from "express"
import { z } from "zod"
import { Event } from "../models/Event.js"
import { INVITATION_STATUS, Invitation } from "../models/Invitation.js"

const createSchema = z.object({
  participantIds: z.array(z.string().min(1)).min(1, "Select at least one participant"),
})

/**
 * Create invitation records for the selected participants of an event.
 * New invitations default to PENDING. Already-invited participants are skipped.
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

  const docs = parsed.data.participantIds.map((participantId) => ({
    eventId,
    participantId,
    status: INVITATION_STATUS.PENDING,
    invitedBy: req.user?.sub,
  }))

  // ordered:false so duplicates (unique index) are skipped without failing the batch.
  let created = 0
  try {
    const result = await Invitation.insertMany(docs, { ordered: false })
    created = result.length
  } catch (err: any) {
    created = err?.result?.insertedCount ?? err?.insertedDocs?.length ?? 0
  }

  const total = await Invitation.countDocuments({ eventId })
  return res.status(201).json({
    message: `${created} invitation(s) created`,
    created,
    skipped: parsed.data.participantIds.length - created,
    totalForEvent: total,
  })
}

/** List invitations for an event with participant details. */
export async function listInvitations(req: Request, res: Response) {
  const { id: eventId } = req.params
  const invitations = await Invitation.find({ eventId })
    .populate("participantId", "firstName middleName lastName email countryCode phoneNumber city")
    .sort({ createdAt: -1 })
    .lean()

  const data = invitations.map((inv: any) => {
    const p = inv.participantId ?? {}
    return {
      id: String(inv._id),
      status: inv.status,
      participant: {
        id: String(p._id ?? ""),
        name:
          [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ").trim() || "—",
        email: p.email ?? "",
        phone: [p.countryCode, p.phoneNumber].filter(Boolean).join(" ").trim(),
        city: p.city ?? "",
      },
    }
  })

  return res.json({ invitations: data })
}
