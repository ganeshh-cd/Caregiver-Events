import type { Request, Response } from "express"
import { Event } from "../models/Event.js"
import { Invitation } from "../models/Invitation.js"
import { User } from "../models/User.js"
import { normalizePhone, RESPONSE_VALUES, sendConfirmationSms } from "../utils/twilio.js"

function normalizeIncomingPhone(raw: string | undefined) {
  if (!raw) return ""
  return normalizePhone(raw)
}

export async function handleTwilioWebhook(req: Request, res: Response) {
  const body = req.body ?? {}
  const from = normalizeIncomingPhone(body.From || body.from)
  const message = String(body.Body || body.body || "").trim().toUpperCase()

  if (!from || !message) {
    return res.status(400).json({ message: "Missing sender or message body" })
  }

  const users = await User.find({}).select("_id firstName lastName countryCode phoneNumber").lean()
  const participant = users.find((item: any) => {
    const fullPhone = [item.countryCode, item.phoneNumber].filter(Boolean).join("").replace(/\D/g, "")
    return normalizePhone(fullPhone) === from || normalizePhone(String(item.phoneNumber || "")) === from
  })

  if (!participant) {
    return res.status(404).json({ message: "Participant not found" })
  }

  const invitation = (await Invitation.findOne({ participantId: participant._id })
    .sort({ createdAt: -1 })
    .lean()) as any

  if (!invitation) {
    return res.status(404).json({ message: "Invitation not found" })
  }

  const mappedResponse = message === RESPONSE_VALUES.YES || message === RESPONSE_VALUES.SELF || message === RESPONSE_VALUES.NO
    ? message
    : null

  if (!mappedResponse) {
    return res.status(400).json({ message: "Unsupported response" })
  }

  await Invitation.updateOne(
    { _id: invitation._id },
    {
      status: mappedResponse,
      response: mappedResponse,
      responseDate: new Date(),
    },
  )

  const event = (await Event.findById(invitation.eventId).lean()) as any

  try {
    await sendConfirmationSms(`+${from}`)
  } catch (error) {
    console.error("[twilio] confirmation failed", error)
  }

  return res.status(200).json({
    ok: true,
    participantId: String(participant._id),
    eventId: String(invitation.eventId),
    eventName: event?.eventName ?? "",
    response: mappedResponse,
    responseDate: new Date(),
  })
}
