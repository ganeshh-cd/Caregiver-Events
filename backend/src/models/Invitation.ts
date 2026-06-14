import mongoose, { Schema, type InferSchemaType } from "mongoose"

export const INVITATION_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
} as const

/**
 * SMS reply options (Phase 2). Participants reply to the invitation SMS:
 *  - YES  = Attending with my caregiver
 *  - SELF = Attending on my own
 *  - NO   = Not attending
 * PENDING is the default until a reply is received.
 */
export const INVITATION_RESPONSE = {
  PENDING: "PENDING",
  YES: "YES",
  SELF: "SELF",
  NO: "NO",
} as const

export type InvitationResponse = (typeof INVITATION_RESPONSE)[keyof typeof INVITATION_RESPONSE]

const invitationSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    participantId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: Object.values(INVITATION_STATUS),
      default: INVITATION_STATUS.PENDING,
    },
    // Phase 2: the participant's SMS reply.
    response: {
      type: String,
      enum: Object.values(INVITATION_RESPONSE),
      default: INVITATION_RESPONSE.PENDING,
      index: true,
    },
    responseDate: { type: Date, default: null },
    // Outbound SMS bookkeeping.
    smsSid: { type: String, default: "" },
    smsStatus: { type: String, default: "" },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "invitations" },
)

// A participant can only be invited to a given event once.
invitationSchema.index({ eventId: 1, participantId: 1 }, { unique: true })

export type InvitationDoc = InferSchemaType<typeof invitationSchema> & {
  _id: mongoose.Types.ObjectId
}

export const Invitation =
  mongoose.models.Invitation || mongoose.model("Invitation", invitationSchema)
