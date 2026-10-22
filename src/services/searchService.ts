import { categories } from '@/data/categories'
import { db, request } from './api'
import { matchesQuery } from './appsService'

const RECENT_KEY = 'adwin:recent-searches'

export const popularSearches = ['budget app', 'strategy games', 'learn spanish', 'pdf scanner', 'ai writing', 'home workout']

export const searchService = {
  search(q: string) {
    return request(
      () => {
        const needle = q.trim().toLowerCase()
        const apps = db.apps.filter((a) => a.status === 'live' && matchesQuery(a, needle)).slice(0, 8)
        const cats = categories.filter((c) => c.name.toLowerCase().includes(needle) || c.slug.includes(needle))
        const clients = db.clients
          .filter((c) => c.name.toLowerCase().includes(needle))
          .map((c) => ({ id: c.id, name: c.name, apps: db.apps.filter((a) => a.clientId === c.id && a.status === 'live') }))
          .filter((c) => c.apps.length)
        return { apps, categories: cats, clients }
      },
      { latency: [90, 220] },
    )
  },
  recent(): string[] {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    } catch {
      return []
    }
  },
  remember(q: string) {
    const term = q.trim()
    if (!term) return
    const next = [term, ...searchService.recent().filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 6)
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  },
  clearRecent() {
    try {
      localStorage.removeItem(RECENT_KEY)
    } catch {
      /* ignore */
    }
  },
}
