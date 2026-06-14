import SearchIcon from "@mui/icons-material/Search"
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material"
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridRowSelectionModel,
} from "@mui/x-data-grid"
import { useEffect, useMemo, useState } from "react"
import { useParticipants } from "../api/hooks"
import type { Participant } from "../api/types"

const columns: GridColDef<Participant>[] = [
  { field: "name", headerName: "Name", flex: 1, minWidth: 160 },
  { field: "email", headerName: "Email", flex: 1.4, minWidth: 200 },
  { field: "phone", headerName: "Phone", flex: 1, minWidth: 130 },
  { field: "city", headerName: "City", flex: 0.8, minWidth: 120 },
]

interface Props {
  open: boolean
  onClose: () => void
  /** Participant ids already invited — excluded from selection counts. */
  alreadyInvitedIds: string[]
  onConfirm: (participantIds: string[]) => void
  saving?: boolean
}

export default function ParticipantPickerDialog({
  open,
  onClose,
  alreadyInvitedIds,
  onConfirm,
  saving,
}: Props) {
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  })
  const [selection, setSelection] = useState<GridRowSelectionModel>([])

  // Debounce search input -> query
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim())
      setPaginationModel((p) => ({ ...p, page: 0 }))
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  // Reset state each time the dialog opens
  useEffect(() => {
    if (open) {
      setSelection([])
      setSearchInput("")
      setSearch("")
      setPaginationModel({ page: 0, pageSize: 10 })
    }
  }, [open])

  const { data, isFetching } = useParticipants({
    search,
    page: paginationModel.page,
    pageSize: paginationModel.pageSize,
  })

  const invitedSet = useMemo(() => new Set(alreadyInvitedIds), [alreadyInvitedIds])
  const rows = data?.participants ?? []
  const rowCount = data?.total ?? 0

  const selectedIds = (selection as (string | number)[]).map(String)

  function handleConfirm() {
    const ids = selectedIds.filter((id) => !invitedSet.has(id))
    onConfirm(ids)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Invite Participants</DialogTitle>
      <DialogContent>
        <TextField
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, email, phone or city"
          fullWidth
          size="small"
          sx={{ my: 1.5 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ height: 440, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.id}
            loading={isFetching}
            checkboxSelection
            keepNonExistentRowsSelected
            disableRowSelectionOnClick
            rowSelectionModel={selection}
            onRowSelectionModelChange={setSelection}
            isRowSelectable={(params) => !invitedSet.has(String(params.id))}
            paginationMode="server"
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" mt={1.5}>
          {selectedIds.filter((id) => !invitedSet.has(id)).length} new participant(s) selected.
          Already-invited participants cannot be selected again.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={saving || selectedIds.filter((id) => !invitedSet.has(id)).length === 0}
        >
          {saving ? "Inviting..." : "Send Invitations"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
