/**
 * OshAds recommendation engine — matches each visitor to the client apps most relevant to them.
 *
 * Pure and dependency-free so the website, the MCP connector and the social agent share one
 * implementation. Every result is explainable (`reasons`) and sponsored placements are flagged.
 *
 * Score = Σ weight × signal, each signal normalised to 0..1:
 *   relevance  0.40  interest + browsing-history category match, tag overlap with viewed apps
 *   quality    0.20  Bayesian-smoothed store rating (few ratings can't outrank many)
 *   momentum   0.15  week-over-week install growth (sigmoid)
 *   popularity 0.10  log-scaled downloads
 *   campaign   0.15  active campaign that is under-delivering for this visitor's market — capped,
 *                    so paid reach can never beat a strongly relevant organic match
 * Then a diversity re-rank (MMR) so one category doesn't fill every slot.
 */
import { categoryBySlug } from '@/data/categories'
import type { Campaign, CategorySlug, MobileApp, Platform } from '@/types'

export interface VisitorSignals {
  /** Interests the visitor picked (onboarding chips) */
  interests?: CategorySlug[]
  /** App ids viewed recently, most recent first */
  viewed?: string[]
  /** App ids already installed/claimed — never re-recommended */
  installed?: string[]
  platform?: Platform
  /** ISO country code, used to match campaign targeting */
  country?: string
}

export interface Recommendation {
  app: MobileApp
  score: number
  sponsored: boolean
  reasons: string[]
  signals: { relevance: number; quality: number; momentum: number; popularity: number; campaign: number }
}

export const WEIGHTS = { relevance: 0.4, quality: 0.2, momentum: 0.15, popularity: 0.1, campaign: 0.15 } as const

const PRIOR_RATING = 4.2 // site-wide mean the smoothing pulls toward
const PRIOR_WEIGHT = 5000 // ratings needed before an app's own average dominates
const DIVERSITY_LAMBDA = 0.75 // 1 = pure score, 0 = pure diversity

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

function jaccard(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0
  const A = new Set(a)
  const inter = b.filter((x) => A.has(x)).length
  return inter / new Set([...a, ...b]).size
}

function bayesianRating(app: MobileApp) {
  return (PRIOR_WEIGHT * PRIOR_RATING + app.ratingCount * app.rating) / (PRIOR_WEIGHT + app.ratingCount)
}

function campaignPressure(app: MobileApp, campaigns: Campaign[], s: VisitorSignals) {
  const today = new Date().toISOString().slice(0, 10)
  let best = 0
  for (const c of campaigns) {
    if (c.appId !== app.id || c.status !== 'active' || c.startDate > today || c.endDate < today) continue
    if (s.country && c.targeting.countries.length && !c.targeting.countries.includes(s.country)) continue
    if (s.platform && !c.targeting.platforms.includes(s.platform)) continue
    if (c.spent >= c.budget) continue
    // Under-delivering campaigns (behind their install target relative to time elapsed) get more help.
    const elapsed = clamp01((Date.now() - +new Date(c.startDate)) / (+new Date(c.endDate) - +new Date(c.startDate)))
    const delivered = c.targetInstalls ? c.downloads / c.targetInstalls : 1
    best = Math.max(best, clamp01(0.4 + (elapsed - delivered)))
  }
  return best
}

function similarity(a: MobileApp, b: MobileApp) {
  return (a.category === b.category ? 0.6 : 0) + 0.4 * jaccard(a.tags, b.tags)
}

export function recommend(apps: MobileApp[], campaigns: Campaign[], signals: VisitorSignals = {}, limit = 8): Recommendation[] {
  const interests = new Set(signals.interests ?? [])
  const viewedApps = (signals.viewed ?? []).map((id) => apps.find((a) => a.id === id)).filter((a): a is MobileApp => !!a)
  const viewedCats = new Set(viewedApps.map((a) => a.category))
  const viewedTags = viewedApps.flatMap((a) => a.tags)
  const exclude = new Set([...(signals.installed ?? []), ...(signals.viewed ?? []).slice(0, 1)]) // skip the app they just saw

  const scored: Recommendation[] = apps
    .filter((a) => a.status === 'live' && !exclude.has(a.id))
    .filter((a) => !signals.platform || a.platforms.includes(signals.platform))
    .map((app) => {
      const interestHit = interests.has(app.category)
      const historyHit = viewedCats.has(app.category)
      const tagOverlap = jaccard(app.tags, viewedTags)
      const relevance = clamp01((interestHit ? 0.7 : 0) + (historyHit ? 0.35 : 0) + tagOverlap * 0.6)
      const quality = clamp01((bayesianRating(app) - 3.5) / 1.5)
      const momentum = 1 / (1 + Math.exp(-app.weeklyGrowth / 15))
      const popularity = clamp01(Math.log10(Math.max(app.downloads, 1)) / 7)
      const campaign = campaignPressure(app, campaigns, signals)
      const score =
        WEIGHTS.relevance * relevance +
        WEIGHTS.quality * quality +
        WEIGHTS.momentum * momentum +
        WEIGHTS.popularity * popularity +
        WEIGHTS.campaign * campaign

      const reasons: string[] = []
      if (interestHit) reasons.push(`Matches your interest in ${categoryBySlug[app.category]?.name ?? app.category}`)
      else if (historyHit || tagOverlap > 0.15) reasons.push('Similar to apps you viewed')
      if (app.rating >= 4.6) reasons.push(`Rated ${app.rating.toFixed(1)}★ by ${Intl.NumberFormat('en', { notation: 'compact' }).format(app.ratingCount)} people`)
      if (app.weeklyGrowth >= 15) reasons.push(`Trending: +${Math.round(app.weeklyGrowth)}% this week`)
      if (app.reward) reasons.push(`Exclusive: ${app.reward}`)
      if (!reasons.length) reasons.push('Popular with OshAds explorers')

      return { app, score, sponsored: campaign > 0, reasons, signals: { relevance, quality, momentum, popularity, campaign } }
    })
    .sort((x, y) => y.score - x.score)

  // Maximal Marginal Relevance: trade a little score for variety across categories.
  const picked: Recommendation[] = []
  const pool = [...scored]
  while (picked.length < limit && pool.length) {
    let bestIdx = 0
    let bestVal = -Infinity
    pool.forEach((cand, i) => {
      const maxSim = picked.length ? Math.max(...picked.map((p) => similarity(cand.app, p.app))) : 0
      const val = DIVERSITY_LAMBDA * cand.score - (1 - DIVERSITY_LAMBDA) * maxSim
      if (val > bestVal) {
        bestVal = val
        bestIdx = i
      }
    })
    picked.push(pool.splice(bestIdx, 1)[0])
  }
  return picked
}
