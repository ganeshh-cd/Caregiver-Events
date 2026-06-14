import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { apiErrorMessage } from "../api/client"
import { useCreateEvent, useEvent, useUpdateEvent } from "../api/hooks"
import type { EventInput } from "../api/types"
import { toDateInputValue } from "../utils/format"

const EMPTY: EventInput = {
  eventName: "",
  description: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  location: "",
  notes: "",
}

export default function EventFormPage({ mode }: { mode: "create" | "edit" }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = mode === "edit"

  const { data: existing, isLoading: loadingEvent } = useEvent(isEdit ? id : undefined)
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent(id ?? "")

  const [form, setForm] = useState<EventInput>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof EventInput, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (isEdit && existing) {
      setForm({
        eventName: existing.eventName ?? "",
        description: existing.description ?? "",
        eventDate: toDateInputValue(existing.eventDate),
        startTime: existing.startTime ?? "",
        endTime: existing.endTime ?? "",
        location: existing.location ?? "",
        notes: existing.notes ?? "",
      })
    }
  }, [isEdit, existing])

  function update<K extends keyof EventInput>(key: K, value: EventInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate(): boolean {
    const next: Partial<Record<keyof EventInput, string>> = {}
    if (!form.eventName.trim()) next.eventName = "Event name is required"
    if (!form.eventDate) next.eventDate = "Event date is required"
    if (form.startTime && form.endTime && form.endTime < form.startTime) {
      next.endTime = "End time must be after start time"
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!validate()) return
    try {
      if (isEdit) {
        await updateEvent.mutateAsync(form)
        navigate(`/events/${id}`)
      } else {
        const created = await createEvent.mutateAsync(form)
        navigate(`/events/${created._id}`)
      }
    } catch (err) {
      setSubmitError(apiErrorMessage(err, "Could not save event"))
    }
  }

  if (isEdit && loadingEvent) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const saving = createEvent.isPending || updateEvent.isPending

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
        color="inherit"
      >
        Back
      </Button>
      <Typography variant="h4" fontWeight={700} mb={0.5}>
        {isEdit ? "Edit Event" : "Create Event"}
      </Typography>
      <Typography color="text.secondary" mb={3}>
        {isEdit
          ? "Update the details for this event."
          : "Fill in the details to schedule a new event."}
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <Card variant="outlined" sx={{ borderRadius: 3, maxWidth: 760 }}>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.5}>
              <TextField
                label="Event name"
                value={form.eventName}
                onChange={(e) => update("eventName", e.target.value)}
                error={Boolean(errors.eventName)}
                helperText={errors.eventName}
                fullWidth
                required
              />
              <TextField
                label="Description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                fullWidth
                multiline
                minRows={2}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5}>
                <TextField
                  label="Event date"
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => update("eventDate", e.target.value)}
                  error={Boolean(errors.eventDate)}
                  helperText={errors.eventDate}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Start time"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => update("startTime", e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="End time"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => update("endTime", e.target.value)}
                  error={Boolean(errors.endTime)}
                  helperText={errors.endTime}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
              <TextField
                label="Location"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                fullWidth
              />
              <TextField
                label="Notes"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>

            <Stack direction="row" spacing={1.5} mt={3}>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Event"}
              </Button>
              <Button color="inherit" onClick={() => navigate(-1)} disabled={saving}>
                Cancel
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
