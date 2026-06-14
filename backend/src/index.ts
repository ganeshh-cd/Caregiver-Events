import cors from "cors"
import express, { type NextFunction, type Request, type Response } from "express"
import { connectWithRetry, isDbConnected } from "./config/db.js"
import { env } from "./config/env.js"
import routes from "./routes/index.js"

const app = express()

app.use(cors({ origin: env.CLIENT_ORIGIN === "*" ? true : env.CLIENT_ORIGIN.split(",") }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "eem-backend", db: isDbConnected() ? "connected" : "connecting" })
})

// Guard data routes: return a clear 503 while the database is still connecting.
app.use("/api", (req, res, next) => {
  if (!isDbConnected()) {
    return res.status(503).json({
      message:
        "Database not connected yet. If using MongoDB Atlas, ensure this server's IP is allowlisted under Network Access.",
    })
  }
  next()
})

app.use("/api", routes)

// 404
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" })
})

// Centralized error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[error]", err)
  if (err?.code === 11000) {
    return res.status(409).json({ message: "Duplicate record" })
  }
  return res.status(500).json({ message: err?.message ?? "Internal server error" })
})

// Start listening immediately so the API is reachable; connect to MongoDB in
// the background with retries.
app.listen(env.PORT, () => {
  console.log(`[server] API listening on http://localhost:${env.PORT}`)
})
void connectWithRetry()
