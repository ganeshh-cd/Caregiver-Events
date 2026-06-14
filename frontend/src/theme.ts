import { createTheme } from "@mui/material/styles"

/**
 * Theme derived from the existing platform theme:
 * - Poppins typography
 * - Borderless DataGrid with the light-blue (#F2F9FC) cell background
 */
const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#0c8599" },
    background: { default: "#f4f7fb", paper: "#ffffff" },
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 500 },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: { border: "none" },
        columnHeaders: { border: "none" },
        footerContainer: { border: "none" },
        row: {
          ":hover .MuiDataGrid-cell": {
            background: "#FFFFFF",
          },
        },
        cell: {
          border: "none",
          background: "#F2F9FC",
        },
      },
    },
  },
})

export default theme
