import twilio from "twilio"

export const RESPONSE_VALUES = {
  YES: "YES",
  SELF: "SELF",
  NO: "NO",
} as const

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_PHONE_NUMBER

export function isTwilioConfigured() {
  return Boolean(accountSid && authToken && fromNumber)
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "")
}

export function formatInvitationMessage(
  participantName: string,
  eventName: string,
  eventDate: string,
  eventLocation: string,
  eventTime: string,
) {
  return [
    `Hello ${participantName}`,
    "",
    "You are invited to:",
    eventName,
    "",
    `Location: ${eventLocation || "TBD"}`,
    `Time: ${eventTime || "TBD"}`,
    "",
    "Date:",
    eventDate,
    "",
    "Please reply with:",
    "YES = Need transportation",
    "SELF = Will attend using own transportation",
    "NO = Not attending",
    "",
    "Thank you.",
  ].join("\n")
}

export function formatConfirmationMessage() {
  return "Thank you. Your response has been recorded."
}

export class TwilioSmsService {
  private client: ReturnType<typeof twilio> | null = null

  constructor() {
    if (isTwilioConfigured()) {
      this.client = twilio(accountSid as string, authToken as string)
    }
  }

  async sendSms(to: string, body: string) {
    if (!this.client || !fromNumber) {
      return null
    }

    const message = await this.client.messages.create({
      body,
      from: fromNumber,
      to,
    })

    return message
  }
}

export async function sendInvitationSms(
  to: string,
  participantName: string,
  eventName: string,
  eventDate: string,
  eventLocation: string,
  eventTime: string,
) {
  const service = new TwilioSmsService()
  const body = formatInvitationMessage(participantName, eventName, eventDate, eventLocation, eventTime)
  return service.sendSms(to, body)
}

export async function sendConfirmationSms(to: string) {
  const service = new TwilioSmsService()
  return service.sendSms(to, formatConfirmationMessage())
}
