import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    proxy: {
      // Proxy API calls to the Express backend during development so the
      // frontend can use same-origin "/api" requests.
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
})
