import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"
import { env } from "./config/env.js"
import { ROLE, USER_STATUS, User } from "./models/User.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

const DEFAULT_ADMIN = {
  firstName: "Admin",
  lastName: "User",
  email: "admin@clouddestinations.com",
  password: "Admin@123",
}

function loadParticipants(): any[] {
  const raw = readFileSync(join(__dirname, "data", "participants.json"), "utf-8")
  const docs = JSON.parse(raw) as any[]
  return docs.map((doc) => {
    // Drop MongoDB extended-JSON _id so a fresh ObjectId is generated.
    const { _id, ...rest } = doc
    return rest
  })
}

async function seed() {
  mongoose.set("strictQuery", true)
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  console.log("[seed] Connected to MongoDB")

  // --- Participants (roleId = 4) ---
  const existingParticipants = await User.countDocuments({ roleId: ROLE.PARTICIPANT })
  if (existingParticipants > 0) {
    console.log(`[seed] ${existingParticipants} participants already exist, skipping import`)
  } else {
    const participants = loadParticipants()
    await User.insertMany(participants, { ordered: false })
    console.log(`[seed] Imported ${participants.length} participants`)
  }

  // --- Default admin (roleId = 1) ---
  const adminEmail = DEFAULT_ADMIN.email.toLowerCase()
  const existingAdmin = await User.findOne({ email: adminEmail })
  if (existingAdmin) {
    console.log(`[seed] Admin already exists: ${adminEmail}`)
  } else {
    const hash = await bcrypt.hash(DEFAULT_ADMIN.password, 10)
    await User.create({
      firstName: DEFAULT_ADMIN.firstName,
      lastName: DEFAULT_ADMIN.lastName,
      email: adminEmail,
      password: hash,
      roleId: ROLE.ADMIN,
      status: USER_STATUS.ACTIVE,
    })
    console.log(`[seed] Created admin -> email: ${adminEmail}  password: ${DEFAULT_ADMIN.password}`)
  }

  const activeParticipants = await User.countDocuments({
    roleId: ROLE.PARTICIPANT,
    status: USER_STATUS.ACTIVE,
  })
  console.log(`[seed] Done. Active participants available for invites: ${activeParticipants}`)

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch((err) => {
  console.error("[seed] Failed", err)
  process.exit(1)
})
