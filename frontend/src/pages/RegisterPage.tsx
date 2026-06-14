import CalendarMonthIcon from "@mui/icons-material/CalendarMonth"
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
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { apiErrorMessage } from "../api/client"
import { useAuth } from "../auth/AuthContext"

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await register(form)
      navigate("/", { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to register"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #0f2d4a 0%, #1976d2 100%)",
        p: 2,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 460, borderRadius: 3 }} elevation={8}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack alignItems="center" spacing={1} mb={3}>
            <Box
              sx={{
                bgcolor: "#e7f1fb",
                width: 56,
                height: 56,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CalendarMonthIcon sx={{ color: "#1976d2", fontSize: 30 }} />
            </Box>
            <Typography variant="h5" fontWeight={600}>
              Create admin account
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Registration creates administrator accounts only
            </Typography>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="First name"
                  value={form.firstName}
                  onChange={update("firstName")}
                  required
                  fullWidth
                />
                <TextField
                  label="Last name"
                  value={form.lastName}
                  onChange={update("lastName")}
                  required
                  fullWidth
                />
              </Stack>
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={update("email")}
                required
                fullWidth
                autoComplete="email"
              />
              <TextField
                label="Password"
                type="password"
                value={form.password}
                onChange={update("password")}
                required
                fullWidth
                helperText="Minimum 6 characters"
                autoComplete="new-password"
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {submitting ? "Creating account..." : "Create account"}
              </Button>
            </Stack>
          </Box>

          <Typography variant="body2" textAlign="center" mt={3} color="text.secondary">
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#1976d2", fontWeight: 500 }}>
              Sign in
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
