/**
 * SMS message templates (Phase 2).
 * Kept in one place so wording is consistent between the invite flow and any
 * future re-send / reminder features.
 */

export interface InvitationMessageVars {
  participantName: string
  eventName: string
  eventDate: string
}

/** The invitation SMS sent to each selected participant. */
export function buildInvitationMessage({
  participantName,
  eventName,
  eventDate,
}: InvitationMessageVars): string {
  const name = participantName?.trim() || "there"
  return [
    `Hello ${name}`,
    "",
    "You are invited to:",
    eventName,
    "",
    `Date: ${eventDate}`,
    "",
    "Reply with:",
    "YES = Attending with my caregiver",
    "SELF = Attending on my own",
    "NO = Not attending",
    "",
    "Thank you.",
  ].join("\n")
}

/** Confirmation SMS sent back after a valid reply is recorded. */
export const RESPONSE_CONFIRMATION_MESSAGE = "Thank you. Your response has been recorded."

/** Reply sent when we cannot interpret the incoming message. */
export const UNRECOGNIZED_REPLY_MESSAGE =
  "Sorry, we didn't understand your reply. Please reply with YES, SELF, or NO."
