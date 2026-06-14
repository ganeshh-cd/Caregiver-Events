import type { Request, Response } from "express"
import twilio from "twilio"
import { INVITATION_RESPONSE, INVITATION_STATUS, Invitation } from "../models/Invitation.js"
import { ROLE, User } from "../models/User.js"
import { phoneMatchKey } from "../utils/phone.js"
import { RESPONSE_CONFIRMATION_MESSAGE, UNRECOGNIZED_REPLY_MESSAGE } from "../utils/smsTemplates.js"

const { MessagingResponse } = twilio.twiml

/** Reply with TwiML so Twilio relays the message back to the sender. */
function reply(res: Response, message: string) {
  const twiml = new MessagingResponse()
  twiml.message(message)
  res.type("text/xml").send(twiml.toString())
}

/**
 * Map a raw SMS body to a supported response, or null if unrecognized.
 * Accepts the words YES/SELF/NO, single-letter aliases (Y/S/N), and the
 * numeric aliases 1/2/3 for participants who find numbers easier to reply.
 */
function parseResponse(body: string): keyof typeof INVITATION_RESPONSE | null {
  const first = body.trim().toUpperCase().split(/\s+/)[0] ?? ""
  if (first === "YES" || first === "Y" || first === "1") return "YES"
  if (first === "SELF" || first === "S" || first === "2") return "SELF"
  if (first === "NO" || first === "N" || first === "3") return "NO"
  return null
}

/** Status kept in sync for backward compatibility with Phase 1's status field. */
function statusForResponse(resp: keyof typeof INVITATION_RESPONSE): string {
  if (resp === "NO") return INVITATION_STATUS.DECLINED
  return INVITATION_STATUS.ACCEPTED
}

/**
 * Twilio inbound-SMS webhook (Phase 2).
 * POST /api/twilio/webhook  (public; Twilio posts application/x-www-form-urlencoded)
 *
 * Flow: match sender phone -> participant -> their most recent pending
 * invitation -> store response + responseDate -> reply with a confirmation.
 */
export async function twilioWebhook(req: Request, res: Response) {
  const from = String(req.body?.From ?? "")
  const body = String(req.body?.Body ?? "")
  console.log(`[twilio:webhook] from=${from} body=${JSON.stringify(body)}`)

  const responseValue = parseResponse(body)
  if (!responseValue) {
    return reply(res, UNRECOGNIZED_REPLY_MESSAGE)
  }

  // Match the sender to a participant using the last 10 digits of the number.
  const key = phoneMatchKey(from)
  if (!key) {
    return reply(res, UNRECOGNIZED_REPLY_MESSAGE)
  }

  const participant = await User.findOne({
    roleId: ROLE.PARTICIPANT,
    phoneNumber: { $regex: `${key}$` },
  })
    .select("_id")
    .lean()

  if (!participant) {
    console.warn(`[twilio:webhook] No participant matched phone key ${key}`)
    return reply(res, "We couldn't find your invitation. Please contact the event organizer.")
  }

  // Prefer the most recent invitation that is still awaiting a reply; if none
  // are pending, fall back to the most recent invitation overall.
  const participantId = (participant as any)._id
  const invitation =
    (await Invitation.findOne({ participantId, response: INVITATION_RESPONSE.PENDING })
      .sort({ createdAt: -1 })
      .exec()) ??
    (await Invitation.findOne({ participantId }).sort({ createdAt: -1 }).exec())

  if (!invitation) {
    return reply(res, "We couldn't find an active invitation for your number.")
  }

  invitation.response = INVITATION_RESPONSE[responseValue]
  invitation.responseDate = new Date()
  invitation.status = statusForResponse(responseValue)
  await invitation.save()

  console.log(
    `[twilio:webhook] Recorded ${responseValue} for invitation ${invitation._id} (participant ${participantId})`,
  )
  return reply(res, RESPONSE_CONFIRMATION_MESSAGE)
}
