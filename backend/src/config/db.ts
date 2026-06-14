import mongoose from "mongoose"
import { env } from "./env.js"

let connected = false

export function isDbConnected(): boolean {
  return connected && mongoose.connection.readyState === 1
}

/**
 * Connect to MongoDB in the background, retrying until it succeeds.
 * The HTTP server starts listening immediately (see index.ts) so the API is
 * reachable right away; data routes simply return 503 until the DB is up.
 *
 * This is important in the sandbox: MongoDB Atlas blocks connections until the
 * connecting IP is added to the Network Access allowlist. Once allowlisted,
 * this loop connects automatically with no restart required.
 */
export async function connectWithRetry(attempt = 1): Promise<void> {
  mongoose.set("strictQuery", true)
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    })
    connected = true
    console.log("[db] Connected to MongoDB")

    mongoose.connection.on("disconnected", () => {
      connected = false
      console.warn("[db] Disconnected from MongoDB")
    })
  } catch (err) {
    connected = false
    const delay = Math.min(30000, attempt * 5000)
    console.error(
      `[db] Connection attempt ${attempt} failed: ${(err as Error).message}. ` +
        `Retrying in ${delay / 1000}s. ` +
        `(If using Atlas, ensure this IP is allowlisted under Network Access.)`,
    )
    setTimeout(() => void connectWithRetry(attempt + 1), delay)
  }
}
