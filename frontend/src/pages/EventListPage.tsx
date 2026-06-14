import AddIcon from "@mui/icons-material/Add"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import EditIcon from "@mui/icons-material/Edit"
import EventIcon from "@mui/icons-material/Event"
import LocationOnIcon from "@mui/icons-material/LocationOn"
import VisibilityIcon from "@mui/icons-material/Visibility"
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { apiErrorMessage } from "../api/client"
import { useDeleteEvent, useEvents } from "../api/hooks"
import type { EventItem } from "../api/types"
import { formatDate } from "../utils/format"

export default function EventListPage() {
  const { data: events, isLoading, isError, error } = useEvents()
  const deleteEvent = useDeleteEvent()
  const navigate = useNavigate()
  const [toDelete, setToDelete] = useState<EventItem | null>(null)

  async function confirmDelete() {
    if (!toDelete) return
    await deleteEvent.mutateAsync(toDelete._id)
    setToDelete(null)
  }

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Events
          </Typography>
          <Typography color="text.secondary">
            Create and manage events, then invite participants.
          </Typography>
        </Box>
        <Button component={Link} to="/events/new" variant="contained" startIcon={<AddIcon />}>
          Create Event
        </Button>
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {apiErrorMessage(error, "Could not load events")}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : events && events.length > 0 ? (
        <Stack spacing={2}>
          {events.map((event) => (
            <Card key={event._id} variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
                      <Typography variant="h6" fontWeight={600} noWrap>
                        {event.eventName}
                      </Typography>
                      <Chip
                        size="small"
                        icon={<EventIcon sx={{ fontSize: 16 }} />}
                        label={formatDate(event.eventDate)}
                        sx={{ bgcolor: "#e7f1fb", color: "#1976d2" }}
                      />
                    </Stack>
                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                      {event.description || "No description provided."}
                    </Typography>
                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                      {(event.startTime || event.endTime) && (
                        <Typography variant="body2" color="text.secondary">
                          {[event.startTime, event.endTime].filter(Boolean).join(" - ")}
                        </Typography>
                      )}
                      {event.location && (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <LocationOnIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                          <Typography variant="body2" color="text.secondary">
                            {event.location}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Tooltip title="View & invite">
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/events/${event._id}`)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => navigate(`/events/${event._id}/edit`)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => setToDelete(event)}>
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <EventIcon sx={{ fontSize: 48, color: "#cbd5e1", mb: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              No events yet
            </Typography>
            <Typography color="text.secondary" mb={2}>
              Get started by creating your first event.
            </Typography>
            <Button component={Link} to="/events/new" variant="contained" startIcon={<AddIcon />}>
              Create Event
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)}>
        <DialogTitle>Delete event?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete &quot;{toDelete?.eventName}&quot; and its invitations.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDelete}
            disabled={deleteEvent.isPending}
          >
            {deleteEvent.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
