import type { Client } from '@/types'
import { db, find, newId, request, save } from './api'

export interface ClientWithStats extends Client {
  appCount: number
  activeCampaigns: number
  totalCampaigns: number
  downloads: number
  spend: number
  conversion: number
}

function withStats(client: Client): ClientWithStats {
  const camps = db.campaigns.filter((c) => c.clientId === client.id)
  const clicks = camps.reduce((s, c) => s + c.clicks, 0)
  const downloads = camps.reduce((s, c) => s + c.downloads, 0)
  return {
    ...client,
    appCount: db.apps.filter((a) => a.clientId === client.id).length,
    activeCampaigns: camps.filter((c) => c.status === 'active').length,
    totalCampaigns: camps.length,
    downloads,
    spend: camps.reduce((s, c) => s + c.spent, 0),
    conversion: clicks ? (downloads / clicks) * 100 : 0,
  }
}

export const clientsService = {
  list(q?: string) {
    return request(() => {
      const needle = q?.toLowerCase().trim()
      return db.clients
        .filter((c) => !needle || [c.name, c.company, c.contactName, c.industry].some((s) => s.toLowerCase().includes(needle)))
        .map(withStats)
    })
  },

  get(id: string) {
    return request(() => {
      const c = db.clients.find((x) => x.id === id)
      return c ? withStats(c) : undefined
    })
  },

  async create(input: Omit<Client, 'id' | 'since'>) {
    const client: Client = { ...input, id: newId('cl'), since: new Date().toISOString().slice(0, 10) }
    return withStats(await save('clients', client, { create: true }))
  },

  async update(id: string, patch: Partial<Client>) {
    return withStats(await save('clients', { ...(await find('clients', id)), ...patch }))
  },
}
