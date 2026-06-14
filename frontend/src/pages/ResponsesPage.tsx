import SearchIcon from "@mui/icons-material/Search"
import {
  Alert,
  Box,
  Chip,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { DataGrid, type GridColDef } from "@mui/x-data-grid"
import { useEffect, useState } from "react"
import { apiErrorMessage } from "../api/client"
import { useEvents, useResponses } from "../api/hooks"
import type { InvitationResponse, ResponseRow } from "../api/types"
import { formatDateTime } from "../utils/format"

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
  YES: "Yes",
  SELF: "Self",
  NO: "No",
}

const RESPONSE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All responses" },
  { value: "PENDING", label: "Pending" },
  { value: "YES", label: "Yes (with caregiver)" },
  { value: "SELF", label: "Self" },
  { value: "NO", label: "No" },
]

function ResponseChip({ value }: { value: InvitationResponse }) {
  return (
    <Chip
      size="small"
      label={responseLabels[value] ?? value}
      sx={{ color: responseColors[value], bgcolor: responseBg[value], fontWeight: 600 }}
    />
  )
}

const columns: GridColDef<ResponseRow>[] = [
  { field: "participantName", headerName: "Participant Name", flex: 1.2, minWidth: 180 },
  { field: "phone", headerName: "Phone", flex: 1, minWidth: 140 },
  { field: "eventName", headerName: "Event", flex: 1.2, minWidth: 180 },
  {
    field: "response",
    headerName: "Response",
    flex: 0.8,
    minWidth: 130,
    renderCell: (params) => <ResponseChip value={params.value as InvitationResponse} />,
    sortable: true,
  },
  {
    field: "responseDate",
    headerName: "Response Date",
    flex: 1,
    minWidth: 180,
    valueFormatter: (value) => formatDateTime(value as string | null),
  },
]

export default function ResponsesPage() {
  const { data: events } = useEvents()

  const [eventId, setEventId] = useState("")
  const [response, setResponse] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")

  // Debounce the free-text search.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data: rows, isFetching, isError, error } = useResponses({ eventId, response, search })

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700}>
          Invitation Responses
        </Typography>
        <Typography color="text.secondary">
          Track how participants replied to their SMS invitations.
        </Typography>
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {apiErrorMessage(error, "Could not load responses")}
        </Alert>
      )}

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        mb={2}
        alignItems={{ xs: "stretch", md: "center" }}
      >
        <TextField
          select
          label="Event"
          size="small"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">All events</MenuItem>
          {(events ?? []).map((ev) => (
            <MenuItem key={ev._id} value={ev._id}>
              {ev.eventName}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Response"
          size="small"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          {RESPONSE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or phone"
          size="small"
          sx={{ flexGrow: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Box sx={{ height: 600, width: "100%", bgcolor: "#fff", borderRadius: 2 }}>
        <DataGrid
          rows={rows ?? []}
          columns={columns}
          getRowId={(row) => row.id}
          loading={isFetching}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
          pageSizeOptions={[10, 25, 50, 100]}
          sx={{ border: "1px solid #e6ebf2", borderRadius: 2 }}
        />
      </Box>
    </Box>
  )
}
