import type { Campaign, CampaignStatus } from '@/types'
import { db, find, request, save } from './api'

export interface CampaignQuery {
  status?: CampaignStatus | 'all'
  q?: string
  clientId?: string
  appId?: string
  includeArchived?: boolean
}

export const campaignMetrics = (c: Campaign) => ({
  ctr: c.impressions ? (c.clicks / c.impressions) * 100 : 0,
  conversion: c.clicks ? (c.downloads / c.clicks) * 100 : 0,
  utilization: c.budget ? (c.spent / c.budget) * 100 : 0,
  targetProgress: c.targetInstalls ? (c.downloads / c.targetInstalls) * 100 : 0,
  ecpi: c.downloads ? c.spent / c.downloads : 0,
})

export type CampaignInput = Omit<Campaign, 'id' | 'impressions' | 'clicks' | 'downloads' | 'revenue' | 'spent' | 'createdAt'>

export const campaignsService = {
  list(query: CampaignQuery = {}) {
    return request(() => {
      let list = db.campaigns.filter((c) => (query.includeArchived || query.status === 'archived' ? true : c.status !== 'archived'))
      if (query.status && query.status !== 'all') list = list.filter((c) => c.status === query.status)
      if (query.clientId) list = list.filter((c) => c.clientId === query.clientId)
      if (query.appId) list = list.filter((c) => c.appId === query.appId)
      if (query.q) {
        const q = query.q.toLowerCase()
        list = list.filter((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
      }
      return list
    })
  },

  get(id: string) {
    return request(() => db.campaigns.find((c) => c.id === id))
  },

  async create(input: CampaignInput) {
    const nums = await request(() => db.campaigns.map((c) => Number(c.id.split('-')[1]) || 0))
    const campaign: Campaign = {
      ...input,
      id: `CMP-${Math.max(1000, ...nums) + 1}`,
      impressions: 0,
      clicks: 0,
      downloads: 0,
      revenue: 0,
      spent: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    campaign.tracking.trackingUrl = campaign.tracking.trackingUrl.replace('{cid}', campaign.id)
    // The server refuses a taken id (409) if two people create at once; the user retries.
    return save('campaigns', campaign, { create: true })
  },

  async update(id: string, patch: Partial<Campaign>) {
    return save('campaigns', { ...(await find('campaigns', id)), ...patch })
  },

  setStatus(id: string, status: CampaignStatus) {
    return campaignsService.update(id, { status })
  },
}
