import fs from "node:fs"
import dotenv from "dotenv"

/**
 * Load environment variables.
 * 1. A local `.env` file in the backend folder (canonical for self-hosting).
 * 2. The v0/Vercel sandbox shared env file, used as a fallback so the app
 *    runs out of the box inside this environment.
 *
 * The local `.env` is loaded with `override: true` so it always wins when
 * present (the sandbox/Vercel runtime may already inject vars into the
 * process environment). The shared sandbox file is then loaded as a
 * non-overriding fallback so the app still runs when no local `.env` exists.
 */
dotenv.config({ override: true })

const sandboxEnvPath = "/vercel/share/.env.project"
if (fs.existsSync(sandboxEnvPath)) {
  dotenv.config({ path: sandboxEnvPath })
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Add it to backend/.env (see backend/.env.example).`,
    )
  }
  return value
}

export const env = {
  MONGODB_URI: required("MONGODB_URI"),
  JWT_SECRET: required("JWT_SECRET"),
  PORT: Number(process.env.PORT ?? 4000),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? "*",
}
