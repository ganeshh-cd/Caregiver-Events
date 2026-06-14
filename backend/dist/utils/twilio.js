import twilio from "twilio";
export const RESPONSE_VALUES = {
    YES: "YES",
    SELF: "SELF",
    NO: "NO",
};
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
export function isTwilioConfigured() {
    return Boolean(accountSid && authToken && fromNumber);
}
export function normalizePhone(phone) {
    return phone.replace(/\D/g, "");
}
export function formatInvitationMessage(participantName, eventName, eventDate) {
    return [
        `Hello ${participantName}`,
        "",
        "You are invited to:",
        eventName,
        "",
        "Date:",
        eventDate,
        "",
        "Reply with:",
        "YES = Need transportation",
        "SELF = Will attend using own transportation",
        "NO = Not attending",
        "",
        "Thank you.",
    ].join("\n");
}
export function formatConfirmationMessage() {
    return "Thank you. Your response has been recorded.";
}
export class TwilioSmsService {
    client = null;
    constructor() {
        if (isTwilioConfigured()) {
            this.client = twilio(accountSid, authToken);
        }
    }
    async sendSms(to, body) {
        if (!this.client || !fromNumber) {
            return null;
        }
        const message = await this.client.messages.create({
            body,
            from: fromNumber,
            to,
        });
        return message;
    }
}
export async function sendInvitationSms(to, participantName, eventName, eventDate) {
    const service = new TwilioSmsService();
    const body = formatInvitationMessage(participantName, eventName, eventDate);
    return service.sendSms(to, body);
}
export async function sendConfirmationSms(to) {
    const service = new TwilioSmsService();
    return service.sendSms(to, formatConfirmationMessage());
}
