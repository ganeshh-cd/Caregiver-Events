import cors from "cors"
import express, { type NextFunction, type Request, type Response } from "express"
import { connectDB } from "./config/db.js"
import { env } from "./config/env.js"
import routes from "./routes/index.js"

const app = express()

app.use(cors({ origin: env.CLIENT_ORIGIN === "*" ? true : env.CLIENT_ORIGIN.split(",") }))
app.use(express.json())

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "eem-backend" })
})

app.use("/api", routes)

// 404
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" })
})

// Centralized error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[error]", err)
  if (err?.code === 11000) {
    return res.status(409).json({ message: "Duplicate record" })
  }
  return res.status(500).json({ message: err?.message ?? "Internal server error" })
})

async function start() {
  await connectDB()
  app.listen(env.PORT, () => {
    console.log(`[server] API listening on http://localhost:${env.PORT}`)
  })
}

start().catch((err) => {
  console.error("[fatal] Failed to start server", err)
  process.exit(1)
})
