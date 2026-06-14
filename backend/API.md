# Backend API Notes

## Twilio SMS invitations

The invitation flow now uses Twilio SMS for event invitations.

### Required environment variables

Set these in backend/.env:

- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_PHONE_NUMBER

### Endpoints

- POST /api/events/:id/invitations
  - Creates event invitations and sends SMS to selected participants.
- POST /api/twilio/webhook
  - Twilio callback for incoming SMS replies.
  - Accepted responses: YES, SELF, NO.
- GET /api/invitations/responses
  - Admin-only listing of invitation responses with filters for event, response, and search.

### Response handling

When Twilio receives a participant reply:

1. Match the sender phone number to a participant.
2. Find the latest invitation for that participant.
3. Store the response and response date on the invitation document.
4. Send a confirmation SMS back to the participant.
