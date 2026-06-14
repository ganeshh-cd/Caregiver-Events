import express, { Router } from "express"
import { login, me, register } from "../controllers/authController.js"
import { getStats } from "../controllers/dashboardController.js"
import {
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  updateEvent,
} from "../controllers/eventController.js"
import {
  createInvitations,
  listInvitations,
  listResponses,
} from "../controllers/invitationController.js"
import { searchParticipants } from "../controllers/participantController.js"
import { twilioWebhook } from "../controllers/twilioController.js"
import { requireAdmin, requireAuth } from "../middleware/auth.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const router = Router()

// --- Auth ---
router.post("/auth/login", asyncHandler(login))
router.post("/auth/register", asyncHandler(register))
router.get("/auth/me", requireAuth, asyncHandler(me))

// --- Twilio inbound webhook (PUBLIC) ---
// Twilio posts application/x-www-form-urlencoded, so parse it here. This route
// is intentionally placed before the auth guard below.
router.post(
  "/twilio/webhook",
  express.urlencoded({ extended: false }),
  asyncHandler(twilioWebhook),
)

// Everything below requires an authenticated admin.
router.use(requireAuth, requireAdmin)

// --- Dashboard ---
router.get("/dashboard/stats", asyncHandler(getStats))

// --- Events ---
router.get("/events", asyncHandler(listEvents))
router.post("/events", asyncHandler(createEvent))
router.get("/events/:id", asyncHandler(getEvent))
router.put("/events/:id", asyncHandler(updateEvent))
router.delete("/events/:id", asyncHandler(deleteEvent))

// --- Participants ---
router.get("/participants", asyncHandler(searchParticipants))

// --- Invitations ---
router.get("/events/:id/invitations", asyncHandler(listInvitations))
router.post("/events/:id/invitations", asyncHandler(createInvitations))

// --- Invitation responses (Phase 2 tracking) ---
router.get("/responses", asyncHandler(listResponses))

export default router
