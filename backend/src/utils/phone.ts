/**
 * Phone number helpers.
 *
 * Participant phone numbers are stored as a separate `countryCode` and
 * `phoneNumber`. Twilio delivers inbound numbers in E.164 form (e.g.
 * "+14155551234"). To reliably match an inbound sender to a stored
 * participant we compare the last 10 significant digits, which is robust to
 * differences in country-code formatting and punctuation.
 */

/** Strip everything except digits. */
export function digitsOnly(value: string | null | undefined): string {
  return String(value ?? "").replace(/\D/g, "")
}

/** The last 10 digits of a number, used as a normalized match key. */
export function phoneMatchKey(value: string | null | undefined): string {
  const digits = digitsOnly(value)
  return digits.slice(-10)
}

/**
 * Build an E.164-ish number for sending. If the stored value already starts
 * with "+", it is used as-is; otherwise the country code (default "1") and
 * national number are concatenated.
 */
export function toE164(countryCode: string | null | undefined, phoneNumber: string | null | undefined): string {
  const raw = String(phoneNumber ?? "").trim()
  if (raw.startsWith("+")) return "+" + digitsOnly(raw)

  const cc = digitsOnly(countryCode) || "1"
  const national = digitsOnly(raw)
  if (!national) return ""
  return `+${cc}${national}`
}
