/**
 * Data access for the growth tools. Uses the project's client catalogue by default (no traffic yet); set
 * OSHADS_API_URL (+ OSHADS_API_TOKEN) to read the live platform instead — no other code changes.
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

function remote(base: string, token?: string): DataSource {
  const get = async <T>(path: string): Promise<T> => {
    const res = await fetch(new URL(path, base), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    if (!res.ok) throw new Error(`OshAds API ${path} → ${res.status}`)
    return (await res.json()) as T
  }
  return {
    apps: () => get('/apps'),
    clients: () => get('/clients'),
    campaigns: () => get('/campaigns'),
    daily: () => get('/analytics/daily'),
    sources: () => get('/analytics/sources'),
    geography: () => get('/analytics/geography'),
  }
}

export const data: DataSource = process.env.OSHADS_API_URL ? remote(process.env.OSHADS_API_URL, process.env.OSHADS_API_TOKEN) : sample
export const usingSampleData = !process.env.OSHADS_API_URL
