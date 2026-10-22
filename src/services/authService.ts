import { rolePermissions } from '@/data/users'
import type { Permission, Session } from '@/types'
import { ApiError, request } from './api'

// Only who is signed in, for the first render. The real credential is an httpOnly cookie the server checks.
const KEY = 'adwin:session'

function readStore(): Session | null {
  try {
    const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Session
    return s.expiresAt > Date.now() ? s : null
  } catch {
    return null
  }
}

export const authService = {
  getSession: readStore,

  async login(email: string, password: string, remember: boolean): Promise<Session> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, remember }),
    }).catch(() => {
      throw new ApiError('Can’t reach the server. Check your connection and try again.', 0)
    })
    const body = (await res.json().catch(() => null)) as (Session & { error?: string }) | null
    if (!res.ok || !body) throw new ApiError(body?.error ?? 'Sign-in failed. Try again.', res.status)
    const session: Session = { user: body.user, expiresAt: body.expiresAt }
    try {
      ;(remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(session))
    } catch {
      /* session still lives in memory */
    }
    return session
  },

  async requestPasswordReset(email: string) {
    await request(() => true, { latency: [500, 800] })
    return { sentTo: email }
  },

  logout() {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    try {
      localStorage.removeItem(KEY)
      sessionStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
  },

  permissionsFor: (session: Session | null): Permission[] => (session ? rolePermissions[session.user.role] : []),
}
