import mongoose, { Schema } from "mongoose";
export const INVITATION_STATUS = {
    PENDING: "PENDING",
    ACCEPTED: "ACCEPTED",
    DECLINED: "DECLINED",
    YES: "YES",
    SELF: "SELF",
    NO: "NO",
};
export const INVITATION_RESPONSE = {
    YES: "YES",
    SELF: "SELF",
    NO: "NO",
};
const invitationSchema = new Schema({
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    participantId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
        type: String,
        enum: Object.values(INVITATION_STATUS),
        default: INVITATION_STATUS.PENDING,
    },
    response: {
        type: String,
        enum: Object.values(INVITATION_RESPONSE),
        default: undefined,
    },
    responseDate: { type: Date, default: null },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true, collection: "invitations" });
// A participant can only be invited to a given event once.
invitationSchema.index({ eventId: 1, participantId: 1 }, { unique: true });
export const Invitation = mongoose.models.Invitation || mongoose.model("Invitation", invitationSchema);
