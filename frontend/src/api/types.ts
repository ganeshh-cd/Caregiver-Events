export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  roleId: number
  status: string
}

export interface EventItem {
  _id: string
  eventName: string
  description: string
  eventDate: string
  startTime: string
  endTime: string
  location: string
  notes: string
  createdAt?: string
  updatedAt?: string
}

export interface EventInput {
  eventName: string
  description: string
  eventDate: string
  startTime: string
  endTime: string
  location: string
  notes: string
}

export interface Participant {
  id: string
  name: string
  email: string
  phone: string
  city: string
}

export interface ParticipantSearchResult {
  participants: Participant[]
  total: number
  page: number
  pageSize: number
}

export interface DashboardStats {
  totalEvents: number
  totalParticipants: number
  upcomingEvents: number
}

export type InvitationResponse = "PENDING" | "YES" | "SELF" | "NO"

export interface Invitation {
  id: string
  status: "PENDING" | "ACCEPTED" | "DECLINED"
  response: InvitationResponse
  responseDate: string | null
  participant: {
    id: string
    name: string
    email: string
    phone: string
    city: string
  }
}

export interface InvitationCounts {
  total: number
  PENDING: number
  YES: number
  SELF: number
  NO: number
}

export interface InvitationsResult {
  invitations: Invitation[]
  counts: InvitationCounts
}

export interface ResponseRow {
  id: string
  participantName: string
  phone: string
  eventId: string
  eventName: string
  response: InvitationResponse
  responseDate: string | null
}

export interface ResponseFilters {
  eventId?: string
  response?: string
  search?: string
}
