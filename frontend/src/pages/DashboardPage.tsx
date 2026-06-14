import EventAvailableIcon from "@mui/icons-material/EventAvailable"
import EventIcon from "@mui/icons-material/Event"
import GroupIcon from "@mui/icons-material/Group"
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material"
import { Link } from "react-router-dom"
import { useDashboardStats } from "../api/hooks"
import { apiErrorMessage } from "../api/client"
import { useAuth } from "../auth/AuthContext"

interface StatCardProps {
  label: string
  value: number | undefined
  loading: boolean
  icon: React.ReactNode
  color: string
  tint: string
}

function StatCard({ label, value, loading, icon, color, tint }: StatCardProps) {
  return (
    <Card sx={{ flex: 1, minWidth: 240, borderRadius: 3 }} elevation={0} variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2,
              bgcolor: tint,
              color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            {loading ? (
              <Skeleton width={60} height={40} />
            ) : (
              <Typography variant="h4" fontWeight={700}>
                {value ?? 0}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, isError, error } = useDashboardStats()

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
            Welcome, {user?.firstName}
          </Typography>
          <Typography color="text.secondary">
            Here is an overview of your events and participants.
          </Typography>
        </Box>
        <Button component={Link} to="/events/new" variant="contained" startIcon={<EventIcon />}>
          Create Event
        </Button>
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {apiErrorMessage(error, "Could not load dashboard stats")}
        </Alert>
      )}

      <Stack direction={{ xs: "column", md: "row" }} spacing={3} mb={4}>
        <StatCard
          label="Total Events"
          value={data?.totalEvents}
          loading={isLoading}
          icon={<EventIcon />}
          color="#1976d2"
          tint="#e7f1fb"
        />
        <StatCard
          label="Total Participants"
          value={data?.totalParticipants}
          loading={isLoading}
          icon={<GroupIcon />}
          color="#0c8599"
          tint="#e2f6f9"
        />
        <StatCard
          label="Upcoming Events"
          value={data?.upcomingEvents}
          loading={isLoading}
          icon={<EventAvailableIcon />}
          color="#2f9e44"
          tint="#e7f7ec"
        />
      </Stack>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={1}>
            Quick actions
          </Typography>
          <Typography color="text.secondary" mb={2}>
            Manage your events and invite active participants.
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Button component={Link} to="/events" variant="outlined">
              View all events
            </Button>
            <Button component={Link} to="/events/new" variant="contained">
              Create a new event
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
