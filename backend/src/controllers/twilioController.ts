import type { Request, Response } from "express"
import { Event } from "../models/Event.js"
import { Invitation } from "../models/Invitation.js"
import { User } from "../models/User.js"
import {
  mapTwilioResponseToInvitationStatus,
  normalizePhone,
  RESPONSE_VALUES,
  sendConfirmationSms,
} from "../utils/twilio.js"

function normalizeIncomingPhone(raw: string | undefined) {
  if (!raw) return ""
  return normalizePhone(raw)
}

export async function handleTwilioWebhook(req: Request, res: Response) {
  const body = req.body ?? {}
  const from = normalizeIncomingPhone(body.From || body.from)
  const rawMessage = String(body.Body || body.body || "").trim().toUpperCase()
  const message = rawMessage.replace(/[^A-Z]/g, "")

  console.log(`[twilio] received message from ${from}:\n${rawMessage}`)

  if (!from || !message) {
    return res.status(400).json({ message: "Missing sender or message body" })
  }

  const users = await User.find({}).select("_id firstName lastName countryCode phoneNumber").lean()
  const participant = users.find((item: any) => {
    const variants = new Set<string>([
      normalizePhone(String(item.phoneNumber || "")),
      normalizePhone([item.countryCode, item.phoneNumber].filter(Boolean).join("")),
      normalizePhone(String(item.countryCode || "") + normalizePhone(String(item.phoneNumber || ""))),
    ])

    return variants.has(from)
  })

  console.log(`[twilio] matched phone ${from} to participant ${participant?._id}`)

  if (!participant) {
    return res.status(404).json({ message: "Participant not found" })
  }

  const invitation = (await Invitation.findOne({ participantId: participant._id })
    .sort({ createdAt: -1 })
    .lean()) as any

  if (!invitation) {
    return res.status(404).json({ message: "Invitation not found" })
  }

  const mappedResponse = [RESPONSE_VALUES.YES, RESPONSE_VALUES.SELF, RESPONSE_VALUES.NO].includes(message as any)
    ? message as typeof RESPONSE_VALUES[keyof typeof RESPONSE_VALUES]
    : null

  if (!mappedResponse) {
    return res.status(400).json({ message: "Unsupported response" })
  }

  const status = mapTwilioResponseToInvitationStatus(mappedResponse)

  await Invitation.updateOne(
    { _id: invitation._id },
    {
      status,
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
