import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import EditIcon from "@mui/icons-material/Edit"
import EventIcon from "@mui/icons-material/Event"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import GroupAddIcon from "@mui/icons-material/GroupAdd"
import LocationOnIcon from "@mui/icons-material/LocationOn"
import PeopleIcon from "@mui/icons-material/People"
import ScheduleIcon from "@mui/icons-material/Schedule"
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material"
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { apiErrorMessage } from "../api/client"
import { useCancelInvitation, useCreateInvitations, useEvent, useInvitations } from "../api/hooks"
import ParticipantPickerDialog from "../components/ParticipantPickerDialog"
import { formatDate } from "../utils/format"

const statusColors: Record<string, string> = {
  PENDING: "#b45309",
  YES: "#15803d",
  SELF: "#2563eb",
  NO: "#b91c1c",
  ACCEPTED: "#15803d",
  DECLINED: "#b91c1c",
}
const statusBg: Record<string, string> = {
  PENDING: "#fef3c7",
  YES: "#dcfce7",
  SELF: "#dbeafe",
  NO: "#fee2e2",
  ACCEPTED: "#dcfce7",
  DECLINED: "#fee2e2",
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box sx={{ color: "#64748b", mt: 0.25 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" textTransform="uppercase">
          {label}
        </Typography>
        <Typography>{value || "—"}</Typography>
      </Box>
    </Stack>
  )
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: event, isLoading, isError, error } = useEvent(id)
  const { data: invitations, isLoading: loadingInvites } = useInvitations(id)
  const createInvitations = useCreateInvitations(id ?? "")
  const cancelInvitation = useCancelInvitation(id ?? "")

  const [pickerOpen, setPickerOpen] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const invitedIds = (invitations ?? []).map((i) => i.participant.id)
  const invitationCounts = (invitations ?? []).reduce(
    (acc, invitation) => {
      const key = invitation.status === "ACCEPTED" ? "YES" : invitation.status
      if (key === "PENDING") acc.pending += 1
      if (key === "YES") acc.yes += 1
      if (key === "SELF") acc.self += 1
      if (key === "NO") acc.no += 1
      return acc
    },
    { pending: 0, yes: 0, self: 0, no: 0 },
  )

  async function handleInvite(participantIds: string[]) {
    setInviteError(null)
    try {
      await createInvitations.mutateAsync(participantIds)
      setPickerOpen(false)
    } catch (err) {
      setInviteError(apiErrorMessage(err, "Could not send invitations"))
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    setInviteError(null)
    try {
      await cancelInvitation.mutateAsync(invitationId)
    } catch (err) {
      setInviteError(apiErrorMessage(err, "Could not cancel invitation"))
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isError || !event) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/events")} sx={{ mb: 2 }}>
          Back to events
        </Button>
        <Alert severity="error">{apiErrorMessage(error, "Event not found")}</Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/events")}
        sx={{ mb: 2 }}
        color="inherit"
      >
        Back to events
      </Button>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {event.eventName}
          </Typography>
          <Chip
            size="small"
            icon={<EventIcon sx={{ fontSize: 16 }} />}
            label={formatDate(event.eventDate)}
            sx={{ mt: 1, bgcolor: "#e7f1fb", color: "#1976d2" }}
          />
        </Box>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/events/${event._id}/edit`)}
        >
          Edit Event
        </Button>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start">
        <Box sx={{ width: { xs: "100%", md: "40%" }, flexShrink: 0 }}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Details
              </Typography>
              <Stack spacing={2}>
                <Typography color="text.secondary">
                  {event.description || "No description provided."}
                </Typography>
                <Divider />
                <InfoRow
                  icon={<ScheduleIcon fontSize="small" />}
                  label="Time"
                  value={[event.startTime, event.endTime].filter(Boolean).join(" - ")}
                />
                <InfoRow
                  icon={<LocationOnIcon fontSize="small" />}
                  label="Location"
                  value={event.location}
                />
                {event.notes && (
                  <InfoRow
                    icon={<EventIcon fontSize="small" />}
                    label="Notes"
                    value={event.notes}
                  />
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ width: { xs: "100%", md: "60%" }, flexGrow: 1 }}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <PeopleIcon sx={{ color: "#1976d2" }} />
                  <Typography variant="h6" fontWeight={600}>
                    Invited Participants
                  </Typography>
                  <Chip size="small" label={invitedIds.length} />
                </Stack>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<GroupAddIcon />}
                  onClick={() => setPickerOpen(true)}
                >
                  Invite Participants
                </Button>
              </Stack>

              {inviteError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {inviteError}
                </Alert>
              )}

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
                {[
                  { label: "Pending", value: invitationCounts.pending },
                  { label: "Yes", value: invitationCounts.yes },
                  { label: "Self", value: invitationCounts.self },
                  { label: "No", value: invitationCounts.no },
                ].map((item) => (
                  <Chip
                    key={item.label}
                    label={`${item.label}: ${item.value}`}
                    size="small"
                    sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                  />
                ))}
              </Stack>

              {loadingInvites ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : invitations && invitations.length > 0 ? (
                <List disablePadding>
                  {invitations.map((inv) => (
                    <ListItem
                      key={inv.id}
                      divider
                      secondaryAction={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            size="small"
                            label={inv.status}
                            sx={{
                              color: statusColors[inv.status],
                              bgcolor: statusBg[inv.status],
                              fontWeight: 600,
                            }}
                          />
                          <IconButton
                            edge="end"
                            aria-label="cancel invitation"
                            onClick={() => handleCancelInvitation(inv.id)}
                            disabled={cancelInvitation.isPending}
                            sx={{ color: "#b91c1c" }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "#e7f1fb", color: "#1976d2" }}>
                          {inv.participant.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={inv.participant.name}
                        secondary={inv.participant.email}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <PeopleIcon sx={{ fontSize: 44, color: "#cbd5e1", mb: 1 }} />
                  <Typography color="text.secondary">
                    No participants invited yet. Click “Invite Participants” to select people and send SMS invitations.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Stack>

      <ParticipantPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        alreadyInvitedIds={invitedIds}
        onConfirm={handleInvite}
        saving={createInvitations.isPending}
      />
    </Box>
  )
}
