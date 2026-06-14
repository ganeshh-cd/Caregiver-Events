import test from 'node:test'
import assert from 'node:assert/strict'

import {
  formatCancellationMessage,
  formatEventUpdatedMessage,
  mapTwilioResponseToInvitationStatus,
} from './twilio.js'

test('formatCancellationMessage includes the event name', () => {
  const text = formatCancellationMessage('Sophia', 'Wellness Walk')

  assert.match(text, /Wellness Walk/)
  assert.match(text, /cancelled/i)
})

test('formatEventUpdatedMessage mentions the new time and location', () => {
  const text = formatEventUpdatedMessage('Sophia', 'Wellness Walk', 'June 21, 2026', 'Community Hall', '10:30 AM - 12:00 PM')

  assert.match(text, /Wellness Walk/)
  assert.match(text, /Community Hall/)
  assert.match(text, /10:30 AM - 12:00 PM/)
})

test('YES and SELF map to an accepted invitation status', () => {
  assert.equal(mapTwilioResponseToInvitationStatus('YES'), 'ACCEPTED')
  assert.equal(mapTwilioResponseToInvitationStatus('SELF'), 'ACCEPTED')
})

test('NO maps to a declined invitation status', () => {
  assert.equal(mapTwilioResponseToInvitationStatus('NO'), 'DECLINED')
})
