/**
 * First-party traffic counter: page views, app opens, download clicks and unique visitors.
 * Cookieless: a visitor is sha256(daily salt + IP + user agent), so nothing is stored on the
 * device and nobody can be followed across days. Bots and crawlers are dropped.
 */
import { createHash, randomBytes } from 'node:crypto'
import { sql } from './db'

const TYPES = new Set(['page_view', 'app_view', 'download_click', 'impression'])
export const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|curl|wget|python|axios|node-fetch|go-http/i

const insert = sql.prepare('INSERT INTO events (ts, day, visitor, type, app_id, path, source, device, os, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')

/** Who sent a request, reduced to what the analytics need. No IP or user agent is stored. */
export interface Visit {
  visitor: string
  device: 'mobile' | 'tablet' | 'desktop'
  os: string
  country: string | null
}

// shortcut: salt lives in memory, so a restart mid-day counts that day's returning visitors twice; persist it if restarts become frequent.
let salt = { day: '', value: '' }
function visitorId(ip: string, ua: string, day: string) {
  if (salt.day !== day) salt = { day, value: randomBytes(16).toString('hex') }
  return createHash('sha256').update(`${salt.value}|${ip}|${ua}`).digest('hex').slice(0, 16)
}

export const deviceOf = (ua: string): Visit['device'] =>
  /ipad|tablet|kindle|silk|playbook|android(?!.*mobile)/i.test(ua) ? 'tablet' : /mobi|iphone|ipod|android/i.test(ua) ? 'mobile' : 'desktop'

export const osOf = (ua: string) =>
  /iphone|ipad|ipod/i.test(ua) ? 'iOS' : /android/i.test(ua) ? 'Android' : /windows/i.test(ua) ? 'Windows' : /cros/i.test(ua) ? 'ChromeOS' : /mac os x|macintosh/i.test(ua) ? 'macOS' : /linux/i.test(ua) ? 'Linux' : 'Other'

/** Null for bots and requests without a user agent: they are accepted but never counted. */
export function visitOf(ip: string, ua: string, country: string | null): Visit | null {
  if (!ua || BOT_UA.test(ua)) return null
  return { visitor: visitorId(ip, ua, new Date().toISOString().slice(0, 10)), device: deviceOf(ua), os: osOf(ua), country }
}

const str = (v: unknown, max: number) => (typeof v === 'string' && v.length <= max ? v : null)
export const cleanSource = (v: unknown) => (str(v, 100) ?? 'direct').toLowerCase()

/** Validates and stores one event (or a batch of card impressions). Returns false when the body is malformed. */
export function recordEvent(raw: string, visit: Visit | null) {
  let body: Record<string, unknown>
  try {
    body = JSON.parse(raw)
  } catch {
    return false
  }
  if (!body || typeof body.type !== 'string' || !TYPES.has(body.type)) return false
  const appIds = body.type === 'impression' ? body.appIds : [body.appId ?? null]
  if (!Array.isArray(appIds) || appIds.length > 60) return false
  if (!visit) return true
  const now = new Date()
  const day = now.toISOString().slice(0, 10)
  const path = str(body.path, 300) ?? '/'
  const source = cleanSource(body.source)
  for (const id of appIds) {
    const appId = id == null ? null : str(id, 64)
    insert.run(now.getTime(), day, visit.visitor, body.type, appId, path, source, visit.device, visit.os, visit.country)
  }
  return true
}

const n = (v: unknown) => Number(v ?? 0)

export function stats(from: string, to: string) {
  const totals = sql
    .prepare(
      `SELECT COUNT(DISTINCT day || visitor) AS visitors, SUM(type = 'page_view') AS pageViews,
              SUM(type = 'app_view') AS appViews, SUM(type = 'download_click') AS downloadClicks
       FROM events WHERE day BETWEEN ? AND ?`,
    )
    .get(from, to) as Record<string, unknown>
  const daily = sql
    .prepare(
      `SELECT day, COUNT(DISTINCT visitor) AS visitors, SUM(type = 'page_view') AS pageViews,
              SUM(type = 'app_view') AS appViews, SUM(type = 'download_click') AS downloadClicks
       FROM events WHERE day BETWEEN ? AND ? GROUP BY day ORDER BY day`,
    )
    .all(from, to)
  const apps = sql
    .prepare(
      `SELECT app_id AS appId, SUM(type = 'app_view') AS views, SUM(type = 'download_click') AS downloads
       FROM events WHERE day BETWEEN ? AND ? AND app_id IS NOT NULL
       GROUP BY app_id ORDER BY downloads DESC, views DESC LIMIT 20`,
    )
    .all(from, to)
  const sources = sql
    .prepare(
      `SELECT source, COUNT(DISTINCT day || visitor) AS visitors, SUM(type = 'download_click') AS downloads
       FROM events WHERE day BETWEEN ? AND ? GROUP BY source ORDER BY visitors DESC LIMIT 10`,
    )
    .all(from, to)
  return {
    from,
    to,
    visitors: n(totals.visitors),
    pageViews: n(totals.pageViews),
    appViews: n(totals.appViews),
    downloadClicks: n(totals.downloadClicks),
    daily: daily.map((d) => ({ day: String(d.day), visitors: n(d.visitors), pageViews: n(d.pageViews), appViews: n(d.appViews), downloadClicks: n(d.downloadClicks) })),
    apps: apps.map((a) => ({ appId: String(a.appId), views: n(a.views), downloads: n(a.downloads) })),
    sources: sources.map((s) => ({ source: String(s.source), visitors: n(s.visitors), downloads: n(s.downloads) })),
  }
}

/**
 * Real engagement per app: app page opens + 3 × download clicks, this week vs the week before.
 * Apps with no traffic are absent from the map.
 */
export function appTrends(now = new Date()) {
  const day = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString().slice(0, 10)
  const weekStart = day(6)
  const rows = sql
    .prepare(
      `SELECT app_id AS appId,
              SUM(CASE WHEN day >= ? THEN (type = 'app_view') + 3 * (type = 'download_click') ELSE 0 END) AS cur,
              SUM(CASE WHEN day <  ? THEN (type = 'app_view') + 3 * (type = 'download_click') ELSE 0 END) AS prev
       FROM events WHERE app_id IS NOT NULL AND day >= ? GROUP BY app_id`,
    )
    .all(weekStart, weekStart, day(13))
  return new Map(
    rows.map((r) => {
      const cur = n(r.cur)
      const prev = n(r.prev)
      // Growth only when there was a previous week to compare with; otherwise 0 (shown as nothing).
      return [String(r.appId), { score: cur, growth: prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : 0 }]
    }),
  )
}
