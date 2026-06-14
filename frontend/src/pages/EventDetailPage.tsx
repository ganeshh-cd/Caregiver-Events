import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import EditIcon from "@mui/icons-material/Edit"
import EventIcon from "@mui/icons-material/Event"
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
import { useCreateInvitations, useEvent, useInvitations } from "../api/hooks"
import ParticipantPickerDialog from "../components/ParticipantPickerDialog"
import { formatDate } from "../utils/format"

const responseColors: Record<string, string> = {
  PENDING: "#b45309",
  YES: "#15803d",
  SELF: "#1d4ed8",
  NO: "#b91c1c",
}
const responseBg: Record<string, string> = {
  PENDING: "#fef3c7",
  YES: "#dcfce7",
  SELF: "#dbeafe",
  NO: "#fee2e2",
}
const responseLabels: Record<string, string> = {
  PENDING: "Pending",
  YES: "Yes (with caregiver)",
  SELF: "Self",
  NO: "No",
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
  const { data: invitesData, isLoading: loadingInvites } = useInvitations(id)
  const createInvitations = useCreateInvitations(id ?? "")

  const [pickerOpen, setPickerOpen] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const invitations = invitesData?.invitations ?? []
  const counts = invitesData?.counts ?? { total: 0, PENDING: 0, YES: 0, SELF: 0, NO: 0 }
  const invitedIds = invitations.map((i) => i.participant.id)

  async function handleInvite(participantIds: string[]) {
    setInviteError(null)
    try {
      await createInvitations.mutateAsync(participantIds)
      setPickerOpen(false)
    } catch (err) {
      setInviteError(apiErrorMessage(err, "Could not send invitations"))
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
                  Invite
                </Button>
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
                  gap: 1.5,
                  mb: 2,
                }}
              >
                {(["PENDING", "YES", "SELF", "NO"] as const).map((key) => (
                  <Box
                    key={key}
                    sx={{
                      borderRadius: 2,
                      p: 1.5,
                      textAlign: "center",
                      bgcolor: responseBg[key],
                      border: "1px solid",
                      borderColor: "rgba(0,0,0,0.04)",
                    }}
                  >
                    <Typography variant="h5" fontWeight={700} sx={{ color: responseColors[key] }}>
                      {counts[key]}
                    </Typography>
                    <Typography variant="caption" sx={{ color: responseColors[key], fontWeight: 600 }}>
                      {responseLabels[key]}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {inviteError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {inviteError}
                </Alert>
              )}

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
                        <Chip
                          size="small"
                          label={responseLabels[inv.response] ?? inv.response}
                          sx={{
                            color: responseColors[inv.response],
                            bgcolor: responseBg[inv.response],
                            fontWeight: 600,
                          }}
                        />
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
                    No participants invited yet. Click &quot;Invite&quot; to add some.
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
