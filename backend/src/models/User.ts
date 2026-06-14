import mongoose, { Schema, type InferSchemaType } from "mongoose"

export const ROLE = {
  ADMIN: 1,
  PARTICIPANT: 4,
} as const

export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const

/**
 * The users collection is shared with the wider platform and contains many
 * fields per document (see the sample participant data). For Phase 1 we only
 * model the fields we read/write; `strict: false` keeps any other existing
 * fields intact when documents round-trip through this service.
 */
const userSchema = new Schema(
  {
    firstName: { type: String, default: "" },
    middleName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    preferredName: { type: String, default: "" },
    email: { type: String, required: true, index: true },
    // Admin accounts created here store a bcrypt hash string.
    // Imported participant records may carry an array/empty value, so we keep it flexible.
    password: { type: Schema.Types.Mixed, default: "" },
    countryCode: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    location: { type: String, default: "" },
    roleId: { type: Number, required: true, index: true },
    status: { type: String, default: USER_STATUS.ACTIVE, index: true },
    userId: { type: Number },
  },
  { timestamps: true, strict: false, collection: "users" },
)

userSchema.index({ roleId: 1, status: 1 })

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId }

export const User = mongoose.models.User || mongoose.model("User", userSchema)
