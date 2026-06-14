import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "./client"
import type {
  DashboardStats,
  EventInput,
  EventItem,
  Invitation,
  InvitationResponseItem,
  ParticipantSearchResult,
} from "./types"

// --- Dashboard ---
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => (await api.get<DashboardStats>("/dashboard/stats")).data,
  })
}

// --- Events ---
export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => (await api.get<{ events: EventItem[] }>("/events")).data.events,
  })
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ["event", id],
    enabled: Boolean(id),
    queryFn: async () => (await api.get<{ event: EventItem }>(`/events/${id}`)).data.event,
  })
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: EventInput) =>
      (await api.post<{ event: EventItem }>("/events", input)).data.event,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] })
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
  })
}

export function useUpdateEvent(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: EventInput) =>
      (await api.put<{ event: EventItem }>(`/events/${id}`, input)).data.event,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] })
      qc.invalidateQueries({ queryKey: ["event", id] })
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/events/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] })
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
  })
}

// --- Participants ---
export function useParticipants(params: { search: string; page: number; pageSize: number }) {
  return useQuery({
    queryKey: ["participants", params],
    queryFn: async () =>
      (
        await api.get<ParticipantSearchResult>("/participants", {
          params: {
            search: params.search,
            page: params.page + 1, // DataGrid is 0-indexed; API is 1-indexed
            pageSize: params.pageSize,
          },
        })
      ).data,
  })
}

// --- Invitations ---
export function useInvitations(eventId: string | undefined) {
  return useQuery({
    queryKey: ["invitations", eventId],
    enabled: Boolean(eventId),
    queryFn: async () =>
      (await api.get<{ invitations: Invitation[] }>(`/events/${eventId}/invitations`)).data
        .invitations,
  })
}

export function useCreateInvitations(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (participantIds: string[]) =>
      (await api.post(`/events/${eventId}/invitations`, { participantIds })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations", eventId] })
    },
  })
}

export function useInvitationResponses(params: {
  eventId?: string
  response?: string
  search?: string
}) {
  return useQuery({
    queryKey: ["invitation-responses", params],
    queryFn: async () =>
      (
        await api.get<{ invitations: InvitationResponseItem[] }>('/invitations/responses', {
          params: {
            eventId: params.eventId || undefined,
            response: params.response || undefined,
            search: params.search || undefined,
          },
        })
      ).data.invitations,
  })
}
