import type { CategorySlug, MobileApp, Platform } from '@/types'
import { ApiError, db, find, newId, request, save } from './api'
import { publish } from './realtime'
import { slugify } from '@/utils/format'
import { source } from '@/lib/track'
import { walletId } from './rewardsService'
import { AGE_KEY } from '@/data/apps'

export type AppSort = 'popular' | 'rating' | 'trending' | 'newest' | 'name'

export interface AppQuery {
  q?: string
  category?: CategorySlug | 'all'
  platform?: Platform | 'all'
  minRating?: number
  sort?: AppSort
  includeHidden?: boolean
}

const isPublic = (a: MobileApp) => a.status === 'live'
const ageConfirmed = () => {
  try {
    return localStorage.getItem(AGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function matchesQuery(app: MobileApp, q: string) {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  return [app.name, app.tagline, app.category, app.developer, ...app.tags].some((s) => s.toLowerCase().includes(needle))
}

function sortApps(list: MobileApp[], sort: AppSort = 'popular') {
  const by: Record<AppSort, (a: MobileApp, b: MobileApp) => number> = {
    popular: (a, b) => b.downloads - a.downloads,
    rating: (a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount,
    trending: (a, b) => b.weeklyGrowth - a.weeklyGrowth,
    newest: (a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.weeklyGrowth - a.weeklyGrowth,
    name: (a, b) => a.name.localeCompare(b.name),
  }
  return [...list].sort(by[sort])
}

export const appsService = {
  list(query: AppQuery = {}) {
    return request(() => {
      let list = db.apps.filter((a) => (query.includeHidden ? true : isPublic(a)))
      if (query.category && query.category !== 'all') list = list.filter((a) => a.category === query.category)
      if (query.platform && query.platform !== 'all') list = list.filter((a) => a.platforms.includes(query.platform as Platform))
      if (query.minRating) list = list.filter((a) => a.rating >= query.minRating!)
      if (query.q) list = list.filter((a) => matchesQuery(a, query.q!))
      return sortApps(list, query.sort)
    })
  },

  getBySlug(slug: string) {
    return request(() => db.apps.find((a) => a.slug === slug && isPublic(a)))
  },

  getById(id: string) {
    return request(() => db.apps.find((a) => a.id === id))
  },

  trending(limit = 12) {
    return request(() =>
      db.apps
        .filter((a) => isPublic(a) && a.trendingRank)
        .sort((a, b) => a.trendingRank! - b.trendingRank!)
        .slice(0, limit),
    )
  },

  featured() {
    return request(() => db.apps.filter((a) => isPublic(a) && a.badge))
  },

  /**
   * Personalised picks from the shared recommendation engine (src/lib/recommend.ts).
   * Each app carries its top reason and whether the placement is sponsored.
   */
  async recommended(interests: CategorySlug[], limit = 8, viewed: string[] = []): Promise<Array<MobileApp & { reason: string; sponsored: boolean }>> {
    // Runs on the server so campaign budgets never reach the browser.
    const qs = new URLSearchParams({ interests: interests.join(','), viewed: viewed.join(','), limit: String(limit) })
    const res = await fetch(`/api/recommendations?${qs}`)
    if (!res.ok) throw new ApiError('Couldn’t load recommendations. Refresh to try again.', res.status)
    return res.json()
  },

  similar(appId: string, limit = 4) {
    return request(() => {
      const app = db.apps.find((a) => a.id === appId)
      if (!app) return []
      return db.apps
        .filter((a) => a.id !== appId && isPublic(a))
        .map((a) => ({
          a,
          score: (a.category === app.category ? 5 : 0) + a.tags.filter((t) => app.tags.includes(t)).length + a.rating,
        }))
        .sort((x, y) => y.score - x.score)
        .slice(0, limit)
        .map((s) => s.a)
    })
  },

  /**
   * Records a Download click on the server, which returns the link to open (with its click id) and whether
   * this browser's wallet now has Osh coins pending for the app.
   */
  async trackClick(app: MobileApp, store?: Platform): Promise<{ redirect: string; reward: 'pending' | 'confirmed' | null }> {
    publish('app:click', { appId: app.id, store: store ?? 'web' })
    const res = await fetch('/api/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: app.id, store, walletId: walletId(true), source: source(), adult: ageConfirmed() }),
    }).catch(() => {
      throw new ApiError('Can’t reach the server. Check your connection.', 0)
    })
    const body = await res.json().catch(() => null)
    if (!res.ok || !body) throw new ApiError(body?.error ?? 'Couldn’t open the link. Try again.', res.status)
    return body
  },

  create(input: Omit<MobileApp, 'id' | 'slug' | 'ratingDistribution'>) {
    const slug = slugify(input.name)
    const app: MobileApp = {
      ...input,
      id: newId('app'),
      slug,
      ratingDistribution: [0.7, 0.18, 0.06, 0.02, 0.04],
    }
    return save('apps', app, { create: true })
  },

  async update(id: string, patch: Partial<MobileApp>) {
    return save('apps', { ...(await find('apps', id)), ...patch })
  },
}
