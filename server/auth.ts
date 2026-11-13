/** Server-side login: scrypt password hashes, httpOnly session cookies, role permissions, login throttling. */
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage } from 'node:http'
import { rolePermissions, users as starterUsers } from '../src/data/users'
import type { Permission, User } from '../src/types'
import { sql } from './db'

const SESSION_HOURS = 8
const SESSION_HOURS_REMEMBERED = 24 * 14
const MAX_ATTEMPTS = 10 // per IP per window
const WINDOW_MS = 15 * 60_000

export function hashPassword(password: string) {
  const salt = randomBytes(16)
  return `scrypt$${salt.toString('hex')}$${scryptSync(password, salt, 64).toString('hex')}`
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, salt, key] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !key) return false
  const want = Buffer.from(key, 'hex')
  return timingSafeEqual(scryptSync(password, Buffer.from(salt, 'hex'), want.length), want)
}

// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_HASH = hashPassword(randomBytes(16).toString('hex'))
const sha = (s: string) => createHash('sha256').update(s).digest('hex')

/** Creates the starter team on an empty database, all with SEED_PASSWORD. */
export function seedUsers() {
  if (sql.prepare('SELECT 1 FROM users LIMIT 1').get()) return
  const password = process.env.SEED_PASSWORD ?? ''
  if (password.length < 12) {
    console.warn('No user accounts yet. Set SEED_PASSWORD (12+ characters) in .env.local and restart to create them.')
    return
  }
  const insert = sql.prepare('INSERT INTO users (id, email, data, password_hash) VALUES (?, ?, ?, ?)')
  for (const u of starterUsers) insert.run(u.id, u.email, JSON.stringify(u), hashPassword(password))
  console.log(`Created ${starterUsers.length} starter accounts.`)
}

const attempts = new Map<string, { count: number; resetAt: number }>()
export function throttled(ip: string) {
  const now = Date.now()
  const a = attempts.get(ip)
  if (!a || a.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  return ++a.count > MAX_ATTEMPTS
}

export function login(email: string, password: string, remember: boolean) {
  const row = sql.prepare('SELECT id, data, password_hash FROM users WHERE email = ?').get(email.trim()) as
    | { id: string; data: string; password_hash: string }
    | undefined
  const ok = verifyPassword(password, row?.password_hash ?? DUMMY_HASH)
  if (!row || !ok) return null
  return startSession(row.id, JSON.parse(row.data) as User, remember)
}

export function startSession(userId: string, user: User, remember: boolean) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = Date.now() + (remember ? SESSION_HOURS_REMEMBERED : SESSION_HOURS) * 3600_000
  sql.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now())
  sql.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(sha(token), userId, expiresAt)
  return { token, expiresAt, remember, user }
}

/**
 * The staff account for a Google-verified work email. Someone signing in for the first time gets a read-only
 * Analyst account; existing accounts keep their role. Google-only accounts have no password, so password login can't open them.
 */
export function staffUser(email: string, name: string) {
  const row = sql.prepare('SELECT id, data FROM users WHERE email = ?').get(email) as { id: string; data: string } | undefined
  if (row) return { id: row.id, user: JSON.parse(row.data) as User }
  const user: User = { id: `u_${randomBytes(6).toString('hex')}`, name, email, role: 'analyst', title: 'Analyst', avatarColor: '#14B8A6' }
  sql.prepare("INSERT INTO users (id, email, data, password_hash) VALUES (?, ?, ?, '')").run(user.id, email, JSON.stringify(user))
  return { id: user.id, user }
}

function sessionToken(req: IncomingMessage) {
  const match = /(?:^|;\s*)sid=([^;]+)/.exec(req.headers.cookie ?? '')
  return match?.[1]
}

export function currentSession(req: IncomingMessage) {
  const token = sessionToken(req)
  if (!token) return null
  const row = sql
    .prepare('SELECT u.data, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?')
    .get(sha(token), Date.now()) as { data: string; expires_at: number } | undefined
  return row ? { user: JSON.parse(row.data) as User, expiresAt: row.expires_at } : null
}

export function logout(req: IncomingMessage) {
  const token = sessionToken(req)
  if (token) sql.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(token))
}

export const can = (user: User | null | undefined, p: Permission) => !!user && rolePermissions[user.role].includes(p)

/** Remembered sessions persist for their lifetime; others end when the browser closes (the server still expires them). */
export function sessionCookie(token: string, opts: { expiresAt?: number; clear?: boolean } = {}) {
  const parts = [`sid=${opts.clear ? '' : token}`, 'HttpOnly', 'SameSite=Lax', 'Path=/']
  if (opts.clear) parts.push('Max-Age=0')
  else if (opts.expiresAt) parts.push(`Max-Age=${Math.round((opts.expiresAt - Date.now()) / 1000)}`)
  // Secure cookies are dropped by the browser over plain http, so only set it once the site is actually on https (SITE_URL).
  if ((process.env.SITE_URL ?? '').startsWith('https://')) parts.push('Secure')
  return parts.join('; ')
}
