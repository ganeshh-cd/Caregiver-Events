import type { Request, Response } from "express"
import { z } from "zod"
import { Event } from "../models/Event.js"
import { Invitation } from "../models/Invitation.js"

const eventSchema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  description: z.string().optional().default(""),
  eventDate: z.string().min(1, "Event date is required"),
  startTime: z.string().optional().default(""),
  endTime: z.string().optional().default(""),
  location: z.string().optional().default(""),
  notes: z.string().optional().default(""),
})

export async function listEvents(_req: Request, res: Response) {
  const events = await Event.find().sort({ eventDate: 1 }).lean()
  return res.json({ events })
}

export async function getEvent(req: Request, res: Response) {
  const event = await Event.findById(req.params.id).lean()
  if (!event) {
    return res.status(404).json({ message: "Event not found" })
  }
  return res.json({ event })
}

export async function createEvent(req: Request, res: Response) {
  const parsed = eventSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Invalid input", errors: parsed.error.flatten().fieldErrors })
  }
  const event = await Event.create({
    ...parsed.data,
    eventDate: new Date(parsed.data.eventDate),
    createdBy: req.user?.sub,
  })
  return res.status(201).json({ event })
}

export async function updateEvent(req: Request, res: Response) {
  const parsed = eventSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Invalid input", errors: parsed.error.flatten().fieldErrors })
  }
  const update: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.eventDate) update.eventDate = new Date(parsed.data.eventDate)

  const event = await Event.findByIdAndUpdate(req.params.id, update, { new: true })
  if (!event) {
    return res.status(404).json({ message: "Event not found" })
  }
  return res.json({ event })
}

export async function deleteEvent(req: Request, res: Response) {
  const event = await Event.findByIdAndDelete(req.params.id)
  if (!event) {
    return res.status(404).json({ message: "Event not found" })
  }
  // Clean up related invitations.
  await Invitation.deleteMany({ eventId: event._id })
  return res.json({ message: "Event deleted" })
}
