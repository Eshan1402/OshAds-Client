import { countryFlag, countryName } from '@/data/geo'
import type {
  ActivityItem,
  DateRange,
  DeviceBreakdown,
  GeoCountry,
  KpiSummary,
  MeasuredTraffic,
  OrganicKeyword,
  OsVersion,
  RangeKey,
  ReferralDomain,
  SourceBreakdown,
  SystemService,
  TimePoint,
} from '@/types'
import { addDays, toISODate } from '@/utils/format'
import { ApiError, db, request } from './api'

/**
 * Every number here comes from the server's real events (server/analytics.ts); nothing is sampled or simulated.
 * One request per range and scope feeds all the widgets, so the dashboard stays consistent.
 */
export type Scope = { type: 'campaign' | 'app' | 'client'; id: string } | undefined

export function resolveRange(key: RangeKey, custom?: { from: string; to: string }): DateRange {
  const today = new Date()
  if (key === 'custom' && custom) return { key, ...custom }
  const days = { today: 1, '7d': 7, '30d': 30, '90d': 90, '1y': 365, custom: 30 }[key]
  return { key, from: toISODate(addDays(today, -(days - 1))), to: toISODate(today) }
}

export const rangeDays = (r: DateRange) =>
  Math.max(1, Math.round((new Date(r.to).getTime() - new Date(r.from).getTime()) / 86_400_000) + 1)

export const rangeLabel: Record<RangeKey, string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '1y': 'Last 12 months',
  custom: 'Custom range',
}

const KEYS = ['visitors', 'sessions', 'impressions', 'clicks', 'downloads', 'revenue'] as const
type Totals = Record<(typeof KEYS)[number], number>

interface Row {
  key: string
  visitors: number
  downloads: number
}
interface Bundle {
  series: TimePoint[]
  previous: TimePoint[]
  sources: Array<Row & { previous: number }>
  devices: Row[]
  os: Row[]
  countries: Row[]
  apps: Record<string, { impressions: number; views: number; clicks: number; downloads: number; revenue: number }>
  campaigns: Record<string, { impressions: number; clicks: number; downloads: number; revenue: number; spent: number }>
}

async function get<T>(path: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(path)
  } catch {
    throw new ApiError('Can’t reach the server. Check your connection.', 0)
  }
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(body?.error ?? 'Couldn’t load analytics.', res.status)
  return body as T
}

// Widgets on one screen ask for the same range at the same moment: share one request for a few seconds.
const inflight = new Map<string, { at: number; promise: Promise<Bundle> }>()
function load(range: DateRange, scope?: Scope) {
  const qs = new URLSearchParams({ from: range.from, to: range.to })
  if (range.key === 'today') qs.set('hourly', '1')
  if (scope) qs.set('scope', scope.type), qs.set('id', scope.id)
  const key = qs.toString()
  const hit = inflight.get(key)
  if (hit && Date.now() - hit.at < 5000) return hit.promise
  const promise = get<Bundle>(`/api/analytics?${key}`)
  inflight.set(key, { at: Date.now(), promise })
  promise.catch(() => inflight.delete(key))
  return promise
}

function sum(points: TimePoint[]): Totals {
  const acc = { visitors: 0, sessions: 0, impressions: 0, clicks: 0, downloads: 0, revenue: 0 }
  for (const p of points) for (const k of KEYS) acc[k] += p[k]
  return acc
}

/** Weekly buckets for long ranges keep charts readable. */
function bucket(points: TimePoint[], size: number) {
  if (size <= 1) return points
  const out: TimePoint[] = []
  for (let i = 0; i < points.length; i += size) out.push({ date: points[i].date, ...sum(points.slice(i, i + size)) })
  return out
}

function sparkFrom(points: TimePoint[], key: (typeof KEYS)[number] | 'conversion', n = 14) {
  const b = bucket(points, Math.max(1, Math.ceil(points.length / n)))
  return b.map((p) => (key === 'conversion' ? (p.clicks ? (p.downloads / p.clicks) * 100 : 0) : p[key]))
}

const pctChange = (cur: number, prev: number) => (prev ? Math.round(((cur - prev) / prev) * 1000) / 10 : 0)
const share = (part: number, whole: number) => (whole ? part / whole : 0)

export const analyticsService = {
  /** Raw event counts for the Measured traffic card. */
  async measured(range: DateRange): Promise<MeasuredTraffic> {
    let res: Response
    try {
      res = await fetch(`/api/stats?from=${range.from}&to=${range.to}`)
    } catch {
      throw new ApiError('Can’t reach the events server. Start it with `npm run events`.', 0)
    }
    const body = await res.json().catch(() => null)
    if (!res.ok || !body) throw new ApiError(body?.error ?? 'The events server isn’t running. Start it with `npm run events`.', res.status)
    const stats = body as Omit<MeasuredTraffic, 'apps'> & { apps: Array<{ appId: string; views: number; downloads: number }> }
    return { ...stats, apps: stats.apps.map((a) => ({ ...a, name: db.apps.find((x) => x.id === a.appId)?.name ?? a.appId })) }
  },

  async series(range: DateRange, scope?: Scope) {
    const b = await load(range, scope)
    return bucket(b.series, rangeDays(range) > 120 ? 7 : 1)
  },

  async kpis(range: DateRange, scope?: Scope): Promise<KpiSummary[]> {
    const b = await load(range, scope)
    const c = sum(b.series)
    const p = sum(b.previous)
    const conv = (t: Totals) => (t.clicks ? (t.downloads / t.clicks) * 100 : 0)
    const liveApps = db.apps.filter((a) => a.status === 'live').length
    const today = new Date().toISOString().slice(0, 10)
    const activeAt = (d: string) => db.campaigns.filter((x) => x.status === 'active' && x.startDate <= d && x.endDate >= d).length
    const prevDay = new Date(Date.parse(range.from) - 86_400_000).toISOString().slice(0, 10)
    return [
      { key: 'visitors', label: 'Total visitors', value: c.visitors, previous: p.visitors, format: 'number', spark: sparkFrom(b.series, 'visitors') },
      { key: 'clicks', label: 'App clicks', value: c.clicks, previous: p.clicks, format: 'number', spark: sparkFrom(b.series, 'clicks') },
      { key: 'downloads', label: 'Confirmed downloads', value: c.downloads, previous: p.downloads, format: 'number', spark: sparkFrom(b.series, 'downloads') },
      { key: 'conversion', label: 'Conversion rate', value: conv(c), previous: conv(p), format: 'percent', spark: sparkFrom(b.series, 'conversion') },
      { key: 'campaigns', label: 'Active campaigns', value: activeAt(today), previous: activeAt(prevDay), format: 'number', spark: [] },
      { key: 'apps', label: 'Active apps', value: liveApps, previous: liveApps, format: 'number', spark: [] },
    ]
  },

  async funnel(range: DateRange, scope?: Scope) {
    const t = sum((await load(range, scope)).series)
    return [
      { stage: 'Impressions', value: t.impressions },
      { stage: 'Clicks', value: t.clicks },
      { stage: 'Downloads', value: t.downloads },
    ]
  },

  async sources(range: DateRange): Promise<SourceBreakdown[]> {
    const rows = (await load(range)).sources
    const total = rows.reduce((a, r) => a + r.visitors, 0)
    return rows.map((r) => ({ source: r.key || 'direct', visitors: r.visitors, downloads: r.downloads, share: share(r.visitors, total), change: pctChange(r.visitors, r.previous) }))
  },

  async geography(range: DateRange): Promise<GeoCountry[]> {
    // Countries come from the CDN header in front of the server; without one they are "Unknown". No regions or cities are collected.
    return (await load(range)).countries.map((r) => ({
      code: r.key || 'XX',
      name: r.key ? countryName(r.key) : 'Unknown',
      flag: r.key ? countryFlag(r.key) : '🌐',
      visitors: r.visitors,
      downloads: r.downloads,
      regions: [],
    }))
  },

  async devices(range: DateRange): Promise<DeviceBreakdown[]> {
    const b = await load(range)
    const os = new Map(b.os.map((r) => [r.key, r]))
    const pick = (k: string) => os.get(k) ?? { visitors: 0, downloads: 0 }
    const tablet = b.devices.find((r) => r.key === 'tablet') ?? { visitors: 0, downloads: 0 }
    const desktop = b.devices.find((r) => r.key === 'desktop') ?? { visitors: 0, downloads: 0 }
    // Phones split by OS; tablets and computers are their own groups.
    const rows: Array<Omit<DeviceBreakdown, 'share'>> = [
      { device: 'Android', users: pick('Android').visitors, downloads: pick('Android').downloads },
      { device: 'iOS', users: pick('iOS').visitors, downloads: pick('iOS').downloads },
      { device: 'Desktop', users: desktop.visitors, downloads: desktop.downloads },
      { device: 'Tablet', users: tablet.visitors, downloads: tablet.downloads },
    ]
    const phones = rows[0].users + rows[1].users
    const phoneTotal = b.devices.find((r) => r.key === 'mobile')?.visitors ?? phones
    // Android/iOS counts include tablets on those systems; keep the phone groups to phones only.
    if (phones > phoneTotal && phones > 0) for (const r of rows.slice(0, 2)) r.users = Math.round((r.users * phoneTotal) / phones)
    const total = rows.reduce((a, r) => a + r.users, 0)
    return rows.map((r) => ({ ...r, share: share(r.users, total) }))
  },

  async operatingSystems(range: DateRange): Promise<OsVersion[]> {
    const rows = (await load(range)).os
    const total = rows.reduce((a, r) => a + r.visitors, 0)
    return rows.map((r) => ({ name: r.key || 'Other', users: r.visitors, share: share(r.visitors, total) }))
  },

  async topApps(range: DateRange, limit = 6) {
    const b = await load(range)
    await request(() => true)
    return db.apps
      .map((a) => {
        const s = b.apps[a.id] ?? { clicks: 0, downloads: 0 }
        return {
          app: a,
          clientName: db.clients.find((c) => c.id === a.clientId)?.name ?? a.developer,
          downloads: s.downloads,
          clicks: s.clicks,
          conversion: s.clicks ? (s.downloads / s.clicks) * 100 : 0,
          growth: a.weeklyGrowth,
        }
      })
      .filter((r) => r.downloads > 0 || r.clicks > 0)
      .sort((x, y) => y.downloads - x.downloads || y.clicks - x.clicks)
      .slice(0, limit)
  },

  /** Per-app and per-campaign counts for a range (reports). */
  async breakdowns(range: DateRange) {
    const b = await load(range)
    return { apps: b.apps, campaigns: b.campaigns, series: b.series }
  },

  async totals(range: DateRange, scope?: Scope) {
    return sum((await load(range, scope)).series)
  },

  async referralDomains(range: DateRange = resolveRange('30d')): Promise<ReferralDomain[]> {
    // Sources that are other websites (utm sources and "direct" are left out).
    return (await load(range)).sources
      .filter((r) => r.key.includes('.'))
      .map((r) => ({ domain: r.key, visitors: r.visitors, downloads: r.downloads, change: pctChange(r.visitors, r.previous) }))
  },

  /** Needs Google Search Console; nothing is shown until it is connected. */
  organicKeywords: async (): Promise<OrganicKeyword[]> => [],
  activity: async (): Promise<ActivityItem[]> => [],
  systemHealth: () => get<SystemService[]>('/api/health'),
}
