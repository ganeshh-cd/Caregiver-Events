import twilio, { type Twilio } from "twilio"
import { env } from "../config/env.js"

export interface SendSmsInput {
  to: string
  body: string
}

export interface SendSmsResult {
  sid: string
  status: string
  to: string
  simulated: boolean
  error?: string
}

/**
 * Thin wrapper around the Twilio REST client.
 *
 * When the three Twilio environment variables are present, real SMS messages
 * are sent. Otherwise the service runs in "simulation" mode: messages are
 * logged and a fake SID is returned, so the rest of the application (invite
 * flow, response tracking, dashboards) works end to end without credentials.
 */
class TwilioService {
  private client: Twilio | null = null
  private readonly from: string

  constructor() {
    this.from = env.TWILIO_PHONE_NUMBER
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER) {
      try {
        this.client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
        console.log("[twilio] Service configured for live SMS sending.")
      } catch (err) {
        console.error("[twilio] Failed to initialize client; falling back to simulation.", err)
        this.client = null
      }
    } else {
      console.warn(
        "[twilio] Credentials not set — running in SIMULATION mode. " +
          "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER to send real SMS.",
      )
    }
  }

  isConfigured(): boolean {
    return this.client !== null
  }

  async sendSms({ to, body }: SendSmsInput): Promise<SendSmsResult> {
    if (!to) {
      return { sid: "", status: "failed", to, simulated: !this.client, error: "Missing recipient phone number" }
    }

    if (!this.client) {
      // Simulation mode — log instead of sending.
      console.log(`[twilio:sim] -> ${to}\n${body}\n`)
      return {
        sid: `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        status: "simulated",
        to,
        simulated: true,
      }
    }

    try {
      const msg = await this.client.messages.create({ to, from: this.from, body })
      return { sid: msg.sid, status: msg.status, to, simulated: false }
    } catch (err: any) {
      console.error(`[twilio] Failed to send SMS to ${to}:`, err?.message ?? err)
      return { sid: "", status: "failed", to, simulated: false, error: err?.message ?? "Send failed" }
    }
  }
}

// Single shared instance.
export const twilioService = new TwilioService()
