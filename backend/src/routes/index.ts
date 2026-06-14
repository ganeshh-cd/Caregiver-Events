import { Router } from "express"
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
  listInvitationResponses,
  listInvitations,
} from "../controllers/invitationController.js"
import { handleTwilioWebhook } from "../controllers/twilioController.js"
import { searchParticipants } from "../controllers/participantController.js"
import { requireAdmin, requireAuth } from "../middleware/auth.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const router = Router()

// --- Twilio webhook (public) ---
router.post("/twilio/webhook", asyncHandler(handleTwilioWebhook))

// --- Auth ---
router.post("/auth/login", asyncHandler(login))
router.post("/auth/register", asyncHandler(register))
router.get("/auth/me", requireAuth, asyncHandler(me))

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
router.get("/invitations/responses", asyncHandler(listInvitationResponses))

export default router
