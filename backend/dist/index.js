import cors from "cors";
import express from "express";
import { connectWithRetry, isDbConnected } from "./config/db.js";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
const app = express();
app.use(cors({ origin: env.CLIENT_ORIGIN === "*" ? true : env.CLIENT_ORIGIN.split(",") }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "eem-backend", db: isDbConnected() ? "connected" : "connecting" });
});
// Guard data routes: return a clear 503 while the database is still connecting.
app.use("/api", (req, res, next) => {
    if (!isDbConnected()) {
        return res.status(503).json({
            message: "Database not connected yet. If using MongoDB Atlas, ensure this server's IP is allowlisted under Network Access.",
        });
    }
    next();
});
app.use("/api", routes);
// 404
app.use((_req, res) => {
    res.status(404).json({ message: "Route not found" });
});
// Centralized error handler
app.use((err, _req, res, _next) => {
    console.error("[error]", err);
    if (err?.code === 11000) {
        return res.status(409).json({ message: "Duplicate record" });
    }
    return res.status(500).json({ message: err?.message ?? "Internal server error" });
});
// Start listening immediately so the API is reachable; connect to MongoDB in
// the background with retries.
function startServer(port) {
    const server = app.listen(port, () => {
        console.log(`[server] API listening on http://localhost:${port}`);
    });
    server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            console.warn(`[server] Port ${port} is already in use. Trying ${port + 1} instead.`);
            server.close(() => startServer(port + 1));
            return;
        }
        console.error("[server] Failed to start API", err);
        process.exit(1);
    });
}
startServer(env.PORT);
void connectWithRetry();
