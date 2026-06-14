import twilio from "twilio";
export const RESPONSE_VALUES = {
    YES: "YES",
    SELF: "SELF",
    NO: "NO",
};
export function mapTwilioResponseToInvitationStatus(response) {
    if (response === RESPONSE_VALUES.YES || response === RESPONSE_VALUES.SELF) {
        return "ACCEPTED";
    }
    if (response === RESPONSE_VALUES.NO) {
        return "DECLINED";
    }
    return "PENDING";
}
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
export function isTwilioConfigured() {
    return Boolean(accountSid && authToken && fromNumber);
}
export function shouldSendSms() {
    return process.env.TWILIO_SEND_SMS === "true" || process.env.TWILIO_SEND_SMS === "1";
}
export function normalizePhone(phone) {
    return phone.replace(/\D/g, "");
}
export function formatInvitationMessage(participantName, eventName, eventDate, eventLocation, eventTime) {
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
    ].join("\n");
}
export function formatConfirmationMessage() {
    return "Thank you. Your response has been recorded.";
}
export function formatCancellationMessage(participantName, eventName) {
    return [
        `Hello ${participantName}`,
        "",
        `Your invitation for ${eventName} has been cancelled.`,
        "",
        "Thank you.",
    ].join("\n");
}
export function formatEventCancelledMessage(participantName, eventName) {
    return [
        `Hello ${participantName}`,
        "",
        `The event ${eventName} has been cancelled.`,
        "",
        "Thank you.",
    ].join("\n");
}
export function formatEventUpdatedMessage(participantName, eventName, eventDate, eventLocation, eventTime) {
    return [
        `Hello ${participantName}`,
        "",
        `The event ${eventName} has been updated.`,
        "",
        `Date: ${eventDate}`,
        `Location: ${eventLocation || "TBD"}`,
        `Time: ${eventTime || "TBD"}`,
        "",
        "Please check your invitation details.",
    ].join("\n");
}
export class TwilioSmsService {
    client = null;
    constructor() {
        if (isTwilioConfigured()) {
            this.client = twilio(accountSid, authToken);
        }
    }
    async sendSms(to, body) {
        if (!shouldSendSms()) {
            console.log(`[twilio] dry-run only: SMS to ${to} not sent (TWILIO_SEND_SMS is not enabled).`);
            return { status: "DRY_RUN", to, body };
        }
        if (!this.client || !fromNumber) {
            return null;
        }
        console.log(`[twilio] sending SMS to ${to}:\n${body}`);
        const message = await this.client.messages.create({
            body,
            from: fromNumber,
            to,
        });
        return message;
    }
}
export async function sendInvitationSms(to, participantName, eventName, eventDate, eventLocation, eventTime) {
    const service = new TwilioSmsService();
    const body = formatInvitationMessage(participantName, eventName, eventDate, eventLocation, eventTime);
    return service.sendSms(to, body);
}
export async function sendCancellationSms(to, participantName, eventName) {
    const service = new TwilioSmsService();
    return service.sendSms(to, formatCancellationMessage(participantName, eventName));
}
export async function sendEventCancelledSms(to, participantName, eventName) {
    const service = new TwilioSmsService();
    return service.sendSms(to, formatEventCancelledMessage(participantName, eventName));
}
export async function sendEventUpdatedSms(to, participantName, eventName, eventDate, eventLocation, eventTime) {
    const service = new TwilioSmsService();
    return service.sendSms(to, formatEventUpdatedMessage(participantName, eventName, eventDate, eventLocation, eventTime));
}
export async function sendConfirmationSms(to) {
    const service = new TwilioSmsService();
    return service.sendSms(to, formatConfirmationMessage());
}
