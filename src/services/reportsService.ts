import type { DateRange, ReportType, SavedReport } from '@/types'
import { db, newId, request, save } from './api'
import { analyticsService } from './analyticsService'

export interface ReportParams {
  type: ReportType
  range: DateRange
  clientId?: string
  campaignId?: string
}

export type ReportRow = Record<string, string | number>

export const reportTypeLabels: Record<ReportType, string> = {
  campaign: 'Campaign report',
  client: 'Client report',
  application: 'Application report',
  traffic: 'Traffic report',
  downloads: 'Download report',
}

export const reportsService = {
  list() {
    return request(() => [...db.reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  },

  /** Builds report rows from real counts for the range (server/analytics.ts). */
  async generate(params: ReportParams): Promise<ReportRow[]> {
    const b = await analyticsService.breakdowns(params.range)
    await request(() => true)
    const app = (id: string) => b.apps[id] ?? { impressions: 0, views: 0, clicks: 0, downloads: 0, revenue: 0 }
    const camp = (id: string) => b.campaigns[id] ?? { impressions: 0, clicks: 0, downloads: 0, revenue: 0, spent: 0 }
    const pct = (a: number, z: number) => (z ? +((a / z) * 100).toFixed(2) : 0)
    let camps = db.campaigns.filter((c) => c.status !== 'draft')
    if (params.clientId) camps = camps.filter((c) => c.clientId === params.clientId)
    if (params.campaignId) camps = camps.filter((c) => c.id === params.campaignId)
    const clientName = (id: string) => db.clients.find((c) => c.id === id)?.name ?? '—'

    switch (params.type) {
      case 'campaign':
        return camps.map((c) => {
          const s = camp(c.id)
          return {
            Campaign: c.name, ID: c.id, Client: clientName(c.clientId), Status: c.status,
            Impressions: s.impressions, Clicks: s.clicks, Downloads: s.downloads,
            'CTR %': pct(s.clicks, s.impressions), 'Conv. %': pct(s.downloads, s.clicks), 'Spend $': s.spent,
          }
        })
      case 'client':
        return db.clients
          .filter((cl) => !params.clientId || cl.id === params.clientId)
          .map((cl) => {
            const apps = db.apps.filter((a) => a.clientId === cl.id).map((a) => app(a.id))
            const cc = camps.filter((c) => c.clientId === cl.id).map((c) => camp(c.id))
            return {
              Client: cl.name, Tier: cl.tier, Campaigns: cc.length,
              Clicks: apps.reduce((a, x) => a + x.clicks, 0),
              Downloads: apps.reduce((a, x) => a + x.downloads, 0),
              'Spend $': cc.reduce((a, x) => a + x.spent, 0),
              'Revenue $': apps.reduce((a, x) => a + x.revenue, 0),
            }
          })
      case 'application':
        return db.apps
          .filter((a) => !params.clientId || a.clientId === params.clientId)
          .map((a) => {
            const s = app(a.id)
            return { App: a.name, Category: a.category, Client: clientName(a.clientId), Impressions: s.impressions, 'Page opens': s.views, Clicks: s.clicks, Downloads: s.downloads, 'Conv. %': pct(s.downloads, s.clicks) }
          })
      case 'traffic':
      case 'downloads':
        return b.series.map((p): ReportRow =>
          params.type === 'traffic'
            ? { Date: p.date, Visitors: p.visitors, Sessions: p.sessions, Impressions: p.impressions, Clicks: p.clicks }
            : { Date: p.date, Clicks: p.clicks, Downloads: p.downloads, 'Conv. %': pct(p.downloads, p.clicks), 'Revenue $': p.revenue },
        )
    }
    return []
  },

  save(report: Omit<SavedReport, 'id' | 'createdAt'>) {
    return save('reports', { ...report, id: newId('r'), createdAt: new Date().toISOString() }, { create: true })
  },
}
