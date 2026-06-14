import mongoose, { Schema } from "mongoose";
const eventSchema = new Schema({
    eventName: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    eventDate: { type: Date, required: true },
    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },
    location: { type: String, default: "" },
    notes: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true, collection: "events" });
export const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);
