/**
 * OshAds server: the API, login, the traffic counter and (in production) the built website, in one process.
 *
 *   Public   GET  /api/public                 live apps + client names
 *            GET  /api/recommendations        ?interests=a,b&viewed=id1,id2&limit=8
 *            POST /api/events                 traffic event or impression batch (see src/lib/track.ts)
 *            POST /api/click                  Download click → { redirect, clickId, reward }
 *            GET  /api/wallet/:walletId       Osh coins for an anonymous browser wallet
 *            GET  /api/postback?click_id&event=install&payout&key   advertiser tracker confirms an install
 *   Auth     POST /api/auth/login | /api/auth/logout    GET /api/auth/session
 *   Staff    GET  /api/db                     everything the dashboard needs (signed in)
 *            PUT  /api/docs/:kind/:id         save a document (?create=1 refuses to overwrite)
 *            GET  /api/stats?from&to          traffic counts (analytics:read, or Bearer STATS_TOKEN)
 *            GET  /api/analytics?from&to[&hourly=1][&scope=app|client|campaign&id]   every dashboard number
 *            GET  /api/live | /api/health     visitors in the last 5 minutes · service checks
 *            GET  /api/admin/rewards?status   POST /api/admin/rewards/:id/confirm|reject   (campaigns:write)
 *            POST /api/admin/reset            reload the starter catalogue (settings:manage)
 *
 * Run: npm run server   (reads .env.local; see .env.example)
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { timingSafeEqual } from 'node:crypto'
import { recommend } from '../src/lib/recommend'
import type { Campaign, CategorySlug, Client, MobileApp, Permission } from '../src/types'
import * as auth from './auth'
import { allDocs, KINDS, putDoc, seedDocs, type Doc, type Kind } from './db'
import { bundle, campaignStats, liveVisitors } from './analytics'
import { appTrends, cleanSource, recordEvent, stats, visitOf } from './events'
import * as rewards from './rewards'

const PORT = Number(process.env.PORT ?? 8788)
const STATS_TOKEN = process.env.STATS_TOKEN ?? ''
const POSTBACK_KEY = process.env.POSTBACK_KEY ?? ''
const TRUST_PROXY = process.env.TRUST_PROXY === '1' // only behind a reverse proxy that sets X-Forwarded-For
const DIST = resolve(process.env.DIST_DIR ?? 'dist')

const WRITE_PERMISSION: Record<Kind, Permission> = {
  apps: 'apps:write',
  campaigns: 'campaigns:write',
  clients: 'clients:write',
  reports: 'reports:export',
  notifications: 'analytics:read',
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

function send(res: ServerResponse, status: number, body?: unknown, headers: Record<string, string> = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers })
  res.end(body === undefined ? '' : JSON.stringify(body))
}

function readBody(req: IncomingMessage, limit: number) {
  return new Promise<string>((resolveBody, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > limit) {
        reject(new HttpError(413, 'Request body too large'))
        req.destroy()
      } else chunks.push(c)
    })
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

async function readJson<T>(req: IncomingMessage, limit = 64 * 1024): Promise<T> {
  try {
    return JSON.parse(await readBody(req, limit)) as T
  } catch (e) {
    throw e instanceof HttpError ? e : new HttpError(400, 'Body must be valid JSON')
  }
}

const clientIp = (req: IncomingMessage) =>
  (TRUST_PROXY ? String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() : '') || req.socket.remoteAddress || ''

/** Country from the CDN in front of us (Cloudflare, Vercel, CloudFront). Unknown without one. */
function countryOf(req: IncomingMessage) {
  if (!TRUST_PROXY) return null
  for (const h of ['cf-ipcountry', 'x-vercel-ip-country', 'cloudfront-viewer-country', 'x-country-code']) {
    const v = String(req.headers[h] ?? '').toUpperCase()
    if (/^[A-Z]{2}$/.test(v) && v !== 'XX' && v !== 'T1') return v
  }
  return null
}

const visit = (req: IncomingMessage) => visitOf(clientIp(req), String(req.headers['user-agent'] ?? ''), countryOf(req))

const safeEqual = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

/** Campaigns as stored, with their delivery computed from real events. */
const liveCampaigns = () => allDocs<Campaign>('campaigns').map((c) => ({ ...c, ...campaignStats(c) }))

/** Blocks cross-site form posts: a browser always sends Origin on these, and it must be this site. */
function sameOrigin(req: IncomingMessage) {
  const origin = req.headers.origin
  if (!origin) return true
  try {
    return new URL(origin).host === req.headers.host
  } catch {
    return false
  }
}

function requireUser(req: IncomingMessage, permission?: Permission) {
  const session = auth.currentSession(req)
  if (!session) throw new HttpError(401, 'Your session has ended. Sign in again.')
  if (permission && !auth.can(session.user, permission)) throw new HttpError(403, 'Your role can’t do that.')
  return session
}

function bearerOk(req: IncomingMessage) {
  const given = Buffer.from(String(req.headers.authorization ?? '').replace(/^Bearer /, ''))
  const want = Buffer.from(STATS_TOKEN)
  return STATS_TOKEN.length >= 16 && given.length === want.length && timingSafeEqual(given, want)
}

/**
 * Trending is computed, never typed in: live apps ranked by the last 7 days of real engagement.
 * Ties (including apps with no traffic yet) keep catalogue order, so the list is never empty.
 */
function withTrending(apps: MobileApp[]) {
  const trends = appTrends()
  const score = (a: MobileApp) => trends.get(a.id)?.score ?? 0
  const rank = new Map(apps.filter((a) => a.status === 'live').sort((a, b) => score(b) - score(a)).map((a, i) => [a.id, i + 1]))
  return apps.map((a) => (rank.has(a.id) ? { ...a, trendingRank: rank.get(a.id), weeklyGrowth: trends.get(a.id)?.growth ?? 0 } : a))
}

const isoDay = (s: string | null) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null)
const list = (s: string | null, max: number) => (s ? s.split(',').filter(Boolean).slice(0, max) : [])

async function api(req: IncomingMessage, res: ServerResponse, url: URL) {
  const { pathname } = url
  const method = req.method ?? 'GET'
  if (method !== 'GET' && !sameOrigin(req)) throw new HttpError(403, 'Cross-site request blocked')

  if (method === 'POST' && pathname === '/api/events') {
    const ok = recordEvent(await readBody(req, 8192), visit(req))
    return ok ? send(res, 204) : send(res, 400, { error: 'Unknown event type or malformed body' })
  }

  if (method === 'POST' && pathname === '/api/click') {
    const body = await readJson<{ appId?: unknown; walletId?: unknown; store?: unknown; source?: unknown }>(req, 2048)
    const app = allDocs<MobileApp>('apps').find((a) => a.id === body.appId && a.status === 'live')
    if (!app) throw new HttpError(404, 'That app isn’t listed any more.')
    const store = body.store === 'ios' || body.store === 'android' ? body.store : null
    const { clickId, reward } = rewards.recordClick(app.id, visit(req), rewards.validWallet(body.walletId) ? body.walletId : null, cleanSource(body.source))
    const dest = (store === 'ios' ? app.appStoreUrl : store === 'android' ? app.playStoreUrl : undefined) ?? app.trackingUrl
    return send(res, 200, { clickId, reward, redirect: dest.replaceAll('{click_id}', clickId) })
  }

  const walletMatch = /^\/api\/wallet\/([^/]+)$/.exec(pathname)
  if (method === 'GET' && walletMatch) {
    if (!rewards.validWallet(walletMatch[1])) throw new HttpError(400, 'Unknown wallet')
    return send(res, 200, rewards.wallet(walletMatch[1]))
  }

  if (method === 'GET' && pathname === '/api/postback') {
    if (POSTBACK_KEY.length < 16 || !safeEqual(url.searchParams.get('key') ?? '', POSTBACK_KEY)) throw new HttpError(401, 'Invalid postback key')
    const clickId = url.searchParams.get('click_id') ?? ''
    const event = (url.searchParams.get('event') ?? 'install').toLowerCase()
    const payout = Number(url.searchParams.get('payout') ?? 0)
    if (!/^[\w-]{8,64}$/.test(clickId) || !/^[a-z_]{1,32}$/.test(event) || !(payout >= 0 && payout <= 100_000)) throw new HttpError(400, 'Check click_id, event and payout')
    if (!rewards.confirmConversion(clickId, event, payout, 'postback')) throw new HttpError(404, 'Unknown click_id')
    return send(res, 200, { ok: true })
  }

  if (method === 'GET' && pathname === '/api/public') {
    const apps = withTrending(allDocs<MobileApp>('apps')).filter((a) => a.status === 'live')
    const clients = allDocs<Client>('clients').map((c) => ({ id: c.id, name: c.name }))
    return send(res, 200, { apps, clients })
  }

  if (method === 'GET' && pathname === '/api/recommendations') {
    const p = url.searchParams
    const limit = Math.min(24, Math.max(1, Number(p.get('limit')) || 8))
    const picks = recommend(withTrending(allDocs<MobileApp>('apps')), allDocs<Campaign>('campaigns'), {
      interests: list(p.get('interests'), 12) as CategorySlug[],
      viewed: list(p.get('viewed'), 20),
    }, limit)
    return send(res, 200, picks.map((r) => ({ ...r.app, reason: r.reasons[0], sponsored: r.sponsored })))
  }

  if (method === 'POST' && pathname === '/api/auth/login') {
    if (auth.throttled(clientIp(req))) throw new HttpError(429, 'Too many sign-in attempts. Wait 15 minutes and try again.')
    const body = await readJson<{ email?: unknown; password?: unknown; remember?: unknown }>(req, 4096)
    if (typeof body.email !== 'string' || typeof body.password !== 'string') throw new HttpError(400, 'Enter your email and password.')
    const s = auth.login(body.email, body.password, body.remember === true)
    if (!s) throw new HttpError(401, 'That email and password combination doesn’t match our records.')
    return send(res, 200, { user: s.user, expiresAt: s.expiresAt }, { 'Set-Cookie': auth.sessionCookie(s.token, { expiresAt: s.remember ? s.expiresAt : undefined }) })
  }

  if (method === 'POST' && pathname === '/api/auth/logout') {
    auth.logout(req)
    return send(res, 204, undefined, { 'Set-Cookie': auth.sessionCookie('', { clear: true }) })
  }

  if (method === 'GET' && pathname === '/api/auth/session') return send(res, 200, requireUser(req))

  if (method === 'GET' && pathname === '/api/db') {
    requireUser(req, 'analytics:read')
    return send(res, 200, { ...Object.fromEntries(KINDS.map((k) => [k, allDocs(k)])), apps: withTrending(allDocs<MobileApp>('apps')), campaigns: liveCampaigns() })
  }

  const docMatch = /^\/api\/docs\/([a-z]+)\/([^/]+)$/.exec(pathname)
  if (method === 'PUT' && docMatch) {
    const kind = docMatch[1] as Kind
    const id = decodeURIComponent(docMatch[2])
    if (!KINDS.includes(kind)) throw new HttpError(404, 'Unknown collection')
    requireUser(req, WRITE_PERMISSION[kind])
    // shortcut: checks shape only (object with matching id); add per-kind zod schemas before opening writes to clients.
    const doc = await readJson<Doc>(req, 2 * 1024 * 1024) // apps may carry uploaded icons as data URLs
    if (!doc || typeof doc !== 'object' || Array.isArray(doc) || doc.id !== id || id.length > 64) throw new HttpError(400, 'Document id must match the URL.')
    if (putDoc(kind, doc, url.searchParams.get('create') === '1') === 'exists') throw new HttpError(409, 'That ID is already taken. Try again.')
    return send(res, 200, doc)
  }

  if (method === 'GET' && pathname === '/api/stats') {
    if (!bearerOk(req)) requireUser(req, 'analytics:read')
    const today = new Date().toISOString().slice(0, 10)
    const to = isoDay(url.searchParams.get('to')) ?? today
    return send(res, 200, stats(isoDay(url.searchParams.get('from')) ?? to, to))
  }

  if (method === 'GET' && pathname === '/api/analytics') {
    requireUser(req, 'analytics:read')
    const p = url.searchParams
    const today = new Date().toISOString().slice(0, 10)
    let from = isoDay(p.get('from')) ?? today
    let to = isoDay(p.get('to')) ?? today
    const id = p.get('id') ?? ''
    const campaigns = allDocs<Campaign>('campaigns')
    let appIds: string[] | null = null
    if (p.get('scope') === 'app') appIds = [id]
    else if (p.get('scope') === 'client') appIds = allDocs<MobileApp>('apps').filter((a) => a.clientId === id).map((a) => a.id)
    else if (p.get('scope') === 'campaign') {
      const c = campaigns.find((x) => x.id === id)
      if (!c) throw new HttpError(404, 'Campaign not found')
      appIds = [c.appId]
      if (from < c.startDate) from = c.startDate
      if (to > c.endDate) to = c.endDate
      if (from > to) to = from
    }
    return send(res, 200, bundle({ from, to, hourly: p.get('hourly') === '1' }, appIds, campaigns))
  }

  if (method === 'GET' && pathname === '/api/live') {
    requireUser(req, 'analytics:read')
    return send(res, 200, { visitors: liveVisitors() })
  }

  if (method === 'GET' && pathname === '/api/health') {
    requireUser(req, 'analytics:read')
    const t = performance.now()
    liveVisitors()
    const dbMs = Math.round(performance.now() - t)
    return send(res, 200, [
      { name: 'API', status: 'operational', latencyMs: 0 },
      { name: 'Database', status: dbMs < 500 ? 'operational' : 'degraded', latencyMs: dbMs },
      { name: 'Install postbacks', status: POSTBACK_KEY.length >= 16 ? 'operational' : 'degraded', latencyMs: 0 },
    ])
  }

  if (method === 'GET' && pathname === '/api/admin/rewards') {
    requireUser(req, 'campaigns:write')
    const status = url.searchParams.get('status') ?? 'pending'
    if (!['pending', 'confirmed', 'rejected'].includes(status)) throw new HttpError(400, 'Unknown status')
    return send(res, 200, rewards.rewardsForReview(status))
  }

  const rewardMatch = /^\/api\/admin\/rewards\/(\d+)\/(confirm|reject)$/.exec(pathname)
  if (method === 'POST' && rewardMatch) {
    requireUser(req, 'campaigns:write')
    const id = Number(rewardMatch[1])
    if (rewardMatch[2] === 'reject') return rewards.rejectReward(id) ? send(res, 204) : send(res, 409, { error: 'Already decided' })
    const clickId = rewards.rewardClick(id)
    if (!clickId) throw new HttpError(404, 'Reward not found')
    rewards.confirmConversion(clickId, 'install', 0, 'staff')
    return send(res, 204)
  }

  if (method === 'POST' && pathname === '/api/admin/reset') {
    requireUser(req, 'settings:manage')
    seedDocs(true)
    return send(res, 204)
  }

  throw new HttpError(404, 'Not found')
}

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2',
}

/** Serves the built site; unknown paths fall back to the pre-rendered page if one exists, else index.html. */
function staticFile(res: ServerResponse, pathname: string) {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '')
  const candidates = [join(DIST, safe), join(DIST, safe, 'index.html'), join(DIST, 'index.html')]
  const file = candidates.find((f) => f.startsWith(DIST) && existsSync(f) && statSync(f).isFile())
  if (!file) return send(res, 404, { error: 'Site not built. Run npm run build.' })
  const immutable = safe.startsWith('/assets/')
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  })
  res.end(readFileSync(file))
}

seedDocs()
auth.seedUsers()

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://local')
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url)
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' })
    staticFile(res, url.pathname)
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message })
    console.error(e)
    send(res, 500, { error: 'Something went wrong on our side. Try again.' })
  }
}).listen(PORT, () => console.log(`OshAds server on http://localhost:${PORT}`))
