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

export interface Invitation {
  id: string
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "YES" | "SELF" | "NO"
  response?: string | null
  responseDate?: string | null
  participant: {
    id: string
    name: string
    email: string
    phone: string
    city: string
  }
}

export interface InvitationResponseItem {
  id: string
  participantName: string
  phone: string
  eventName: string
  response: string
  responseDate?: string | null
}
