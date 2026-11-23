/**
 * Data access for the growth tools. Uses the project's client catalogue by default (no traffic yet); set
 * OSHADS_API_URL (the site, e.g. https://click.oshads.com) and OSHADS_API_TOKEN (the server's STATS_TOKEN)
 * to read the live platform instead — no other code changes.
 */
import { apps as sampleApps } from '../../src/data/apps'
import { campaigns as sampleCampaigns } from '../../src/data/campaigns'
import { clients as sampleClients } from '../../src/data/clients'
import type { Campaign, Client, MobileApp, TimePoint } from '../../src/types'

export interface DataSource {
  apps(): Promise<MobileApp[]>
  clients(): Promise<Client[]>
  campaigns(): Promise<Campaign[]>
  daily(): Promise<TimePoint[]>
  sources(): Promise<Array<{ source: string; share: number; change: number; conv: number }>>
  geography(): Promise<Array<{ code: string; name: string; visitors: number; downloads: number }>>
}

const sample: DataSource = {
  apps: async () => sampleApps,
  clients: async () => sampleClients,
  campaigns: async () => sampleCampaigns,
  // Traffic only exists on the running server; offline the tools see none rather than invented numbers.
  daily: async () => [],
  sources: async () => [],
  geography: async () => [],
}

type Breakdown = Array<{ key: string; visitors: number; downloads: number; previous?: number }>
type Analytics = { series: TimePoint[]; sources: Breakdown; countries: Breakdown }
const DAYS = 60 // trafficSummary compares a period with the one before it, up to 30 + 30 days
const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10)
const share = (part: number, whole: number) => (whole ? part / whole : 0)
const countryName = (code: string) => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code
  } catch {
    return code || 'Unknown'
  }
}

/** Reads the live server: /api/db for the catalogue and campaigns, /api/analytics for traffic. */
function remote(base: string, token?: string): DataSource {
  const get = async <T>(path: string): Promise<T> => {
    const res = await fetch(new URL(path, base), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    if (!res.ok) throw new Error(`OshAds API ${path} → ${res.status}${res.status === 401 ? ' (check OSHADS_API_TOKEN matches the server STATS_TOKEN)' : ''}`)
    return (await res.json()) as T
  }
  // One fetch per tool call is plenty; a short cache stops a tool that reads several kinds from hitting the server repeatedly.
  const cached = <T>(load: () => Promise<T>) => {
    let at = 0
    let value: Promise<T> | null = null
    return () => {
      if (!value || Date.now() - at > 60_000) {
        at = Date.now()
        value = load().catch((e) => ((value = null), Promise.reject(e)))
      }
      return value
    }
  }
  const db = cached(() => get<{ apps: MobileApp[]; clients: Client[]; campaigns: Campaign[] }>('/api/db'))
  const traffic = cached(() => get<Analytics>(`/api/analytics?from=${day(1 - DAYS)}&to=${day(0)}`))
  return {
    apps: async () => (await db()).apps,
    clients: async () => (await db()).clients,
    campaigns: async () => (await db()).campaigns,
    daily: async () => (await traffic()).series,
    sources: async () => {
      const rows = (await traffic()).sources
      const total = rows.reduce((s, r) => s + r.visitors, 0)
      return rows.map((r) => ({
        source: r.key || 'direct',
        share: share(r.visitors, total),
        change: r.previous ? Math.round(((r.visitors - r.previous) / r.previous) * 100) : 0,
        conv: share(r.downloads, r.visitors),
      }))
    },
    geography: async () => {
      const rows = (await traffic()).countries
      const total = rows.reduce((s, r) => s + r.visitors, 0)
      // visitors as a share of the total, which is how insights.ts reads it
      return rows.map((r) => ({ code: r.key, name: countryName(r.key), visitors: share(r.visitors, total), downloads: r.downloads }))
    },
  }
}

export const data: DataSource = process.env.OSHADS_API_URL ? remote(process.env.OSHADS_API_URL, process.env.OSHADS_API_TOKEN) : sample
export const usingSampleData = !process.env.OSHADS_API_URL
