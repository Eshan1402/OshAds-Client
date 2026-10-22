import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadDb } from '@/services/api'
import { authService } from '@/services/authService'
import { queryClient } from '@/services/queryClient'
import type { Permission, Session } from '@/types'

interface AuthCtx {
  session: Session | null
  isAuthenticated: boolean
  permissions: Permission[]
  can: (p: Permission) => boolean
  login: (email: string, password: string, remember: boolean) => Promise<Session>
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(authService.getSession)

  // Staff get the full dataset, visitors the public catalogue. A rejected cookie signs the user out.
  useEffect(() => {
    loadDb(session ? 'staff' : 'public')
      .then(() => queryClient.invalidate(''))
      .catch((e: { status?: number }) => {
        if (session && e.status === 401) {
          authService.logout()
          setSession(null)
        }
      })
  }, [session])

  // Expire the session client-side when its TTL passes.
  useEffect(() => {
    if (!session) return
    const ms = session.expiresAt - Date.now()
    const t = setTimeout(() => {
      authService.logout()
      setSession(null)
    }, Math.min(ms, 2 ** 31 - 1))
    return () => clearTimeout(t)
  }, [session])

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const s = await authService.login(email, password, remember)
    setSession(s)
    return s
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setSession(null)
  }, [])

  const value = useMemo<AuthCtx>(() => {
    const permissions = authService.permissionsFor(session)
    return {
      session,
      isAuthenticated: !!session,
      permissions,
      can: (p) => permissions.includes(p),
      login,
      logout,
    }
  }, [session, login, logout])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
