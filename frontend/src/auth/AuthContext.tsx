import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { api, clearToken, getToken, setToken } from "../api/client"
import type { AuthUser } from "../api/types"

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (input: {
    firstName: string
    lastName: string
    email: string
    password: string
  }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get<{ user: AuthUser }>("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const res = await api.post<{ token: string; user: AuthUser }>("/auth/login", {
      email,
      password,
    })
    setToken(res.data.token)
    setUser(res.data.user)
  }

  async function register(input: {
    firstName: string
    lastName: string
    email: string
    password: string
  }) {
    const res = await api.post<{ token: string; user: AuthUser }>("/auth/register", input)
    setToken(res.data.token)
    setUser(res.data.user)
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
