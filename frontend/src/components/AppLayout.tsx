import CalendarMonthIcon from "@mui/icons-material/CalendarMonth"
import DashboardIcon from "@mui/icons-material/Dashboard"
import EventIcon from "@mui/icons-material/Event"
import LogoutIcon from "@mui/icons-material/Logout"
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"

const DRAWER_WIDTH = 248

const NAV_ITEMS = [
  { label: "Dashboard", to: "/", icon: <DashboardIcon /> },
  { label: "Events", to: "/events", icon: <EventIcon /> },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  function isActive(to: string) {
    if (to === "/") return location.pathname === "/"
    return location.pathname.startsWith(to)
  }

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRight: "1px solid #e6ebf2",
            backgroundColor: "#0f2d4a",
            color: "#e8eef5",
          },
        }}
      >
        <Box sx={{ px: 3, py: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
          <CalendarMonthIcon sx={{ color: "#7fc4ff" }} />
          <Typography variant="h6" fontWeight={600} fontSize="1.05rem" lineHeight={1.2}>
            Elderly Events
          </Typography>
        </Box>
        <List sx={{ px: 1.5 }}>
          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.to}
              component={Link}
              to={item.to}
              selected={isActive(item.to)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: "#cdd9e6",
                "& .MuiListItemIcon-root": { color: "#cdd9e6", minWidth: 38 },
                "&.Mui-selected": {
                  backgroundColor: "#1976d2",
                  color: "#fff",
                  "& .MuiListItemIcon-root": { color: "#fff" },
                  "&:hover": { backgroundColor: "#1565c0" },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: "0.92rem" }}>
                {item.label}
              </ListItemText>
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: "#ffffff",
            color: "#1f2937",
            borderBottom: "1px solid #e6ebf2",
          }}
        >
          <Toolbar sx={{ justifyContent: "flex-end", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar sx={{ bgcolor: "#1976d2", width: 36, height: 36, fontSize: "0.95rem" }}>
                {(user?.firstName?.[0] ?? "A").toUpperCase()}
              </Avatar>
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography fontSize="0.9rem" fontWeight={600} lineHeight={1.1}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography fontSize="0.75rem" color="text.secondary">
                  Administrator
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
