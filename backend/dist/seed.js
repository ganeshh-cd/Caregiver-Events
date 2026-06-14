import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { ROLE, USER_STATUS, User } from "./models/User.js";
const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ADMIN = {
    firstName: "Admin",
    lastName: "User",
    email: "admin@clouddestinations.com",
    password: "Admin@123",
};
/**
 * The export is MongoDB Extended JSON, so values look like
 * `{ "$oid": "..." }` and `{ "$date": "..." }`. Mongoose can't cast those
 * wrapper objects, so we recursively unwrap them into plain values.
 */
function reviveExtendedJson(value) {
    if (Array.isArray(value))
        return value.map(reviveExtendedJson);
    if (value && typeof value === "object") {
        const keys = Object.keys(value);
        if (keys.length === 1) {
            if (keys[0] === "$oid")
                return String(value.$oid);
            if (keys[0] === "$date")
                return new Date(value.$date);
            if (keys[0] === "$numberInt")
                return Number(value.$numberInt);
            if (keys[0] === "$numberLong")
                return Number(value.$numberLong);
            if (keys[0] === "$numberDouble")
                return Number(value.$numberDouble);
        }
        const out = {};
        for (const key of keys)
            out[key] = reviveExtendedJson(value[key]);
        return out;
    }
    return value;
}
function loadUsersFromFile(filePath) {
    const raw = readFileSync(filePath, "utf-8");
    const docs = reviveExtendedJson(JSON.parse(raw));
    return docs.map((doc) => {
        // Drop the original _id so a fresh ObjectId is generated, and let the
        // schema's timestamps manage createdAt/updatedAt.
        const { _id, createdAt, updatedAt, __v, ...rest } = doc;
        return rest;
    });
}
async function seed() {
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log("[seed] Connected to MongoDB");
    // --- Participants (roleId = 4) ---
    const existingParticipants = await User.countDocuments({ roleId: ROLE.PARTICIPANT });
    if (existingParticipants > 0) {
        console.log(`[seed] ${existingParticipants} participants already exist, skipping import`);
    }
    else {
        const participants = loadUsersFromFile(join(__dirname, "data", "participants.json"));
        await User.insertMany(participants, { ordered: false });
        console.log(`[seed] Imported ${participants.length} participants`);
    }
    // --- QA users export (users module) ---
    const qaUsersFile = join(__dirname, "..", "qa_caregiver.users.json");
    const qaUsers = loadUsersFromFile(qaUsersFile);
    if (qaUsers.length > 0) {
        const bulkOps = qaUsers.map((doc) => ({
            updateOne: {
                filter: { $or: [{ email: doc.email }, { userId: doc.userId }] },
                update: { $set: doc },
                upsert: true,
            },
        }));
        const writeResult = await User.bulkWrite(bulkOps, { ordered: false });
        console.log(`[seed] Imported/updated ${writeResult.upsertedCount + writeResult.modifiedCount} QA users from ${qaUsersFile}`);
    }
    // --- Default admin (roleId = 1) ---
    const adminEmail = DEFAULT_ADMIN.email.toLowerCase();
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
        console.log(`[seed] Admin already exists: ${adminEmail}`);
    }
    else {
        const hash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
        await User.create({
            firstName: DEFAULT_ADMIN.firstName,
            lastName: DEFAULT_ADMIN.lastName,
            email: adminEmail,
            password: hash,
            roleId: ROLE.ADMIN,
            status: USER_STATUS.ACTIVE,
        });
        console.log(`[seed] Created admin -> email: ${adminEmail}  password: ${DEFAULT_ADMIN.password}`);
    }
    const activeParticipants = await User.countDocuments({
        roleId: ROLE.PARTICIPANT,
        status: USER_STATUS.ACTIVE,
    });
    console.log(`[seed] Done. Active participants available for invites: ${activeParticipants}`);
    await mongoose.disconnect();
    process.exit(0);
}
seed().catch((err) => {
    console.error("[seed] Failed", err);
    process.exit(1);
});
