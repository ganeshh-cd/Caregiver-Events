import SearchIcon from "@mui/icons-material/Search"
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { DataGrid, type GridColDef } from "@mui/x-data-grid"
import { useMemo, useState } from "react"
import { useEvents } from "../api/hooks"
import { useInvitationResponses } from "../api/hooks"

const RESPONSE_COLORS: Record<string, string> = {
  PENDING: "#b45309",
  YES: "#15803d",
  SELF: "#2563eb",
  NO: "#b91c1c",
}

export default function InvitationResponsesPage() {
  const { data: events = [] } = useEvents()
  const [eventId, setEventId] = useState("")
  const [response, setResponse] = useState("")
  const [search, setSearch] = useState("")

  const params = useMemo(() => ({ eventId, response, search }), [eventId, response, search])
  const { data: rows = [], isLoading, isError, error } = useInvitationResponses(params)

  const columns: GridColDef[] = [
    { field: "participantName", headerName: "Participant Name", flex: 1.2 },
    { field: "phone", headerName: "Phone", flex: 1 },
    { field: "eventName", headerName: "Event", flex: 1.4 },
    {
      field: "response",
      headerName: "Response",
      flex: 0.8,
      renderCell: (params) => (
        <Chip
          label={params.value || "PENDING"}
          size="small"
          sx={{
            bgcolor: (RESPONSE_COLORS[params.value as string] ?? "#e2e8f0") + "20",
            color: RESPONSE_COLORS[params.value as string] ?? "#334155",
            border: `1px solid ${RESPONSE_COLORS[params.value as string] ?? "#cbd5e1"}`,
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      field: "responseDate",
      headerName: "Response Date",
      flex: 1,
      valueGetter: (value) => (value ? new Date(value).toLocaleString() : "—"),
    },
  ]

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Invitation Responses
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Track SMS replies, filter by event and response, and monitor participant attendance preferences.
      </Typography>

      <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="event-filter-label">Event</InputLabel>
              <Select
                labelId="event-filter-label"
                label="Event"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              >
                <MenuItem value="">All events</MenuItem>
                {events.map((event) => (
                  <MenuItem key={event._id} value={event._id}>
                    {event.eventName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="response-filter-label">Response</InputLabel>
              <Select
                labelId="response-filter-label"
                label="Response"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
              >
                <MenuItem value="">All responses</MenuItem>
                <MenuItem value="YES">YES</MenuItem>
                <MenuItem value="SELF">SELF</MenuItem>
                <MenuItem value="NO">NO</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Search"
              placeholder="Search participant or event"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
          </Stack>
        </CardContent>
      </Card>

      {isError && <Alert severity="error">{String(error)}</Alert>}

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ height: 520, width: "100%" }}>
              <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(row) => row.id}
                disableRowSelectionOnClick
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                pageSizeOptions={[10, 25, 50]}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
