import { CircularProgress, Box } from "@mui/material"
import { Navigate, Route, Routes } from "react-router-dom"
import { useAuth } from "./auth/AuthContext"
import AppLayout from "./components/AppLayout"
import DashboardPage from "./pages/DashboardPage"
import EventDetailPage from "./pages/EventDetailPage"
import EventFormPage from "./pages/EventFormPage"
import EventListPage from "./pages/EventListPage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"

function FullScreenLoader() {
  return (
    <Box
      sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}
    >
      <CircularProgress />
    </Box>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/events" element={<EventListPage />} />
        <Route path="/events/new" element={<EventFormPage mode="create" />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/events/:id/edit" element={<EventFormPage mode="edit" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
