/**
 * Every dashboard number, computed from real rows. Definitions:
 *   visitors     distinct cookieless visitors per day (a returning visitor counts once per day)
 *   sessions     runs of a visitor's activity with no gap longer than 30 minutes
 *   impressions  app cards that were at least half on screen
 *   clicks       Download / Visit-website clicks
 *   downloads    confirmed installs (advertiser postback or staff confirmation)
 *   revenue      payouts reported with confirmed conversions
 */
import type { Campaign } from '../src/types'
import { sql } from './db'

const SESSION_GAP_MS = 30 * 60_000
const LIVE_WINDOW_MS = 5 * 60_000
const DAY_MS = 86_400_000

export interface Point {
  date: string
  visitors: number
  sessions: number
  impressions: number
  clicks: number
  downloads: number
  revenue: number
}

const n = (v: unknown) => Number(v ?? 0)
const isoDay = (t: number) => new Date(t).toISOString().slice(0, 10)
const inList = (ids: string[]) => ids.map(() => '?').join(',') || "''"

/** A time window: whole days, or (for "today") the last 24 hours in hourly buckets. */
export type Window = { from: string; to: string; hourly?: boolean; now?: number }

function bounds(w: Window) {
  const now = w.now ?? Date.now()
  if (w.hourly) {
    const end = Math.floor(now / 3_600_000) * 3_600_000 + 3_600_000
    return { start: end - 24 * 3_600_000, end }
  }
  return { start: Date.parse(`${w.from}T00:00:00Z`), end: Date.parse(`${w.to}T00:00:00Z`) + DAY_MS }
}

function buckets(w: Window) {
  const { start, end } = bounds(w)
  const step = w.hourly ? 3_600_000 : DAY_MS
  const keys: string[] = []
  for (let t = start; t < end; t += step) keys.push(w.hourly ? new Date(t).toISOString() : isoDay(t))
  return keys
}

const bucketExpr = (w: Window, col = 'ts') =>
  w.hourly ? `strftime('%Y-%m-%dT%H:00:00.000Z', ${col} / 1000, 'unixepoch')` : `strftime('%Y-%m-%d', ${col} / 1000, 'unixepoch')`

/** Time series for the window. `appIds` limits it to activity on those apps (null = whole site). */
export function series(w: Window, appIds: string[] | null): Point[] {
  const { start, end } = bounds(w)
  const scope = appIds ? `AND app_id IN (${inList(appIds)})` : ''
  const ids = appIds ?? []
  const traffic = sql
    .prepare(
      `WITH e AS (
         SELECT ts, visitor, type, app_id,
                CASE WHEN ts - LAG(ts) OVER (PARTITION BY visitor ORDER BY ts) <= ${SESSION_GAP_MS} THEN 0 ELSE 1 END AS starts
         FROM events WHERE ts >= ? AND ts < ?
       ), s AS (
         SELECT *, SUM(starts) OVER (PARTITION BY visitor ORDER BY ts ROWS UNBOUNDED PRECEDING) AS sess FROM e
       )
       SELECT ${bucketExpr(w)} AS b, COUNT(DISTINCT visitor) AS visitors, COUNT(DISTINCT visitor || ':' || sess) AS sessions,
              SUM(type = 'impression') AS impressions, SUM(type = 'download_click') AS clicks
       FROM s WHERE 1 = 1 ${scope} GROUP BY b`,
    )
    .all(start, end, ...ids)
  const conv = sql
    .prepare(
      `SELECT ${bucketExpr(w)} AS b, SUM(event = 'install') AS downloads, SUM(payout) AS revenue
       FROM conversions WHERE ts >= ? AND ts < ? ${scope} GROUP BY b`,
    )
    .all(start, end, ...ids)
  const t = new Map(traffic.map((r) => [String(r.b), r]))
  const c = new Map(conv.map((r) => [String(r.b), r]))
  return buckets(w).map((date) => ({
    date,
    visitors: n(t.get(date)?.visitors),
    sessions: n(t.get(date)?.sessions),
    impressions: n(t.get(date)?.impressions),
    clicks: n(t.get(date)?.clicks),
    downloads: n(c.get(date)?.downloads),
    revenue: Math.round(n(c.get(date)?.revenue) * 100) / 100,
  }))
}

/** Visitors and confirmed downloads grouped by one attribute of the visit (source, device, os, country). */
function breakdown(w: Window, appIds: string[] | null, col: 'source' | 'device' | 'os' | 'country') {
  const { start, end } = bounds(w)
  const scope = appIds ? `AND app_id IN (${inList(appIds)})` : ''
  const ids = appIds ?? []
  const visitors = sql
    .prepare(`SELECT ${col} AS k, COUNT(DISTINCT day || visitor) AS v FROM events WHERE ts >= ? AND ts < ? ${scope} GROUP BY k`)
    .all(start, end, ...ids)
  const downloads = sql
    .prepare(
      `SELECT k.${col} AS k, COUNT(*) AS d FROM conversions c JOIN clicks k ON k.click_id = c.click_id
       WHERE c.event = 'install' AND c.ts >= ? AND c.ts < ? ${appIds ? `AND c.app_id IN (${inList(appIds)})` : ''} GROUP BY k.${col}`,
    )
    .all(start, end, ...ids)
  const d = new Map(downloads.map((r) => [String(r.k ?? ''), n(r.d)]))
  const keys = new Set([...visitors.map((r) => String(r.k ?? '')), ...d.keys()])
  const v = new Map(visitors.map((r) => [String(r.k ?? ''), n(r.v)]))
  return [...keys].map((k) => ({ key: k, visitors: v.get(k) ?? 0, downloads: d.get(k) ?? 0 })).sort((a, b) => b.visitors - a.visitors)
}

/** Per-app counts in the window. */
function perApp(w: Window) {
  const { start, end } = bounds(w)
  const ev = sql
    .prepare(
      `SELECT app_id AS id, SUM(type = 'impression') AS impressions, SUM(type = 'app_view') AS views, SUM(type = 'download_click') AS clicks
       FROM events WHERE ts >= ? AND ts < ? AND app_id IS NOT NULL GROUP BY app_id`,
    )
    .all(start, end)
  const cv = sql
    .prepare(`SELECT app_id AS id, SUM(event = 'install') AS downloads, SUM(payout) AS revenue FROM conversions WHERE ts >= ? AND ts < ? GROUP BY app_id`)
    .all(start, end)
  const out = new Map<string, { impressions: number; views: number; clicks: number; downloads: number; revenue: number }>()
  const get = (id: string) => out.get(id) ?? out.set(id, { impressions: 0, views: 0, clicks: 0, downloads: 0, revenue: 0 }).get(id)!
  for (const r of ev) Object.assign(get(String(r.id)), { impressions: n(r.impressions), views: n(r.views), clicks: n(r.clicks) })
  for (const r of cv) Object.assign(get(String(r.id)), { downloads: n(r.downloads), revenue: n(r.revenue) })
  return out
}

const sumPoints = (ps: Point[]) =>
  ps.reduce((a, p) => ({ visitors: a.visitors + p.visitors, sessions: a.sessions + p.sessions, impressions: a.impressions + p.impressions, clicks: a.clicks + p.clicks, downloads: a.downloads + p.downloads, revenue: a.revenue + p.revenue }), { visitors: 0, sessions: 0, impressions: 0, clicks: 0, downloads: 0, revenue: 0 })

/** What a campaign has delivered inside its own dates (and the optional window), and what that costs at its bid. */
export function campaignStats(c: Campaign, w?: Window) {
  const today = isoDay(Date.now())
  const from = w ? (w.from > c.startDate ? w.from : c.startDate) : c.startDate
  const toCap = w ? (w.to < c.endDate ? w.to : c.endDate) : c.endDate
  const to = toCap < today ? toCap : today
  if (from > to) return { impressions: 0, clicks: 0, downloads: 0, revenue: 0, spent: 0 }
  const t = sumPoints(series({ from, to }, [c.appId]))
  const units = { CPI: t.downloads, CPA: t.downloads, CPC: t.clicks, CPM: t.impressions / 1000 }[c.payoutModel] ?? 0
  const spent = Math.round(Math.min(units * c.bid, c.budget) * 100) / 100
  return { impressions: t.impressions, clicks: t.clicks, downloads: t.downloads, revenue: spent, spent }
}

/**
 * Engagement in the window. "Returning" needs the consent cookie (visitor ids starting with "c"):
 * a consenting visitor counts as returning when they were active on at least two different days.
 */
export function engagement(w: Window) {
  const { start, end } = bounds(w)
  const one = (q: string, ...p: unknown[]) => sql.prepare(q).get(...(p as never[])) as Record<string, unknown>
  const top = (type: string, limit = 8) =>
    sql
      .prepare(`SELECT label, COUNT(*) AS n FROM events WHERE type = ? AND label IS NOT NULL AND ts >= ? AND ts < ? GROUP BY label ORDER BY n DESC LIMIT ${limit}`)
      .all(type, start, end)
      .map((r) => ({ label: String(r.label), count: n(r.n) }))
  const consented = n(one("SELECT COUNT(DISTINCT visitor) AS v FROM events WHERE visitor LIKE 'c%' AND ts >= ? AND ts < ?", start, end).v)
  const returning = n(
    one(
      `SELECT COUNT(*) AS v FROM (SELECT visitor FROM events WHERE visitor LIKE 'c%' AND ts < ?
         GROUP BY visitor HAVING COUNT(DISTINCT day) >= 2 AND MAX(ts) >= ?)`,
      end,
      start,
    ).v,
  )
  const avg = (type: string) => n(one('SELECT AVG(value) AS v FROM events WHERE type = ? AND value IS NOT NULL AND ts >= ? AND ts < ?', type, start, end).v)
  return {
    consented,
    returning,
    avgSeconds: Math.round(avg('page_time')),
    avgScroll: Math.round(avg('scroll')),
    games: top('game_start'),
    searches: top('search'),
    filters: top('filter'),
    outbound: top('outbound'),
  }
}

/** Everything the analytics screens need for one window, plus the same totals for the window before it. */
export function bundle(w: Window, appIds: string[] | null, campaigns: Campaign[]) {
  const days = w.hourly ? 1 : Math.round((Date.parse(w.to) - Date.parse(w.from)) / DAY_MS) + 1
  const prev: Window = w.hourly
    ? { ...w, now: (w.now ?? Date.now()) - DAY_MS }
    : { from: isoDay(Date.parse(w.from) - days * DAY_MS), to: isoDay(Date.parse(w.to) - days * DAY_MS) }
  const cur = series(w, appIds)
  const before = series(prev, appIds)
  const prevSources = new Map(breakdown(prev, appIds, 'source').map((r) => [r.key, r.visitors]))
  return {
    series: cur,
    previous: before,
    sources: breakdown(w, appIds, 'source').map((r) => ({ ...r, previous: prevSources.get(r.key) ?? 0 })),
    devices: breakdown(w, appIds, 'device'),
    os: breakdown(w, appIds, 'os'),
    countries: breakdown(w, appIds, 'country'),
    apps: Object.fromEntries(perApp(w)),
    campaigns: Object.fromEntries(campaigns.map((c) => [c.id, campaignStats(c, w)])),
    engagement: appIds ? null : engagement(w),
  }
}

/** Distinct visitors active in the last five minutes, site-wide. */
export function liveVisitors(now = Date.now()) {
  return n(sql.prepare('SELECT COUNT(DISTINCT visitor) AS v FROM events WHERE ts >= ?').get(now - LIVE_WINDOW_MS)?.v)
}
