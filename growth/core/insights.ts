/** Traffic and campaign analysis shared by the MCP connector and the social agent. */
import { recommend, type VisitorSignals } from '../../src/lib/recommend'
import type { Campaign } from '../../src/types'
import { data } from './data'

const pct = (a: number, b: number) => (b ? +((a / b) * 100).toFixed(2) : 0)

export function campaignMetrics(c: Campaign) {
  return {
    id: c.id,
    name: c.name,
    status: c.status,
    clientId: c.clientId,
    appId: c.appId,
    impressions: c.impressions,
    clicks: c.clicks,
    downloads: c.downloads,
    ctrPct: pct(c.clicks, c.impressions),
    conversionPct: pct(c.downloads, c.clicks),
    budget: c.budget,
    spent: c.spent,
    budgetUsedPct: pct(c.spent, c.budget),
    targetInstalls: c.targetInstalls,
    targetProgressPct: pct(c.downloads, c.targetInstalls),
    effectiveCPI: c.downloads ? +(c.spent / c.downloads).toFixed(2) : null,
    countries: c.targeting.countries,
    window: `${c.startDate} → ${c.endDate}`,
  }
}

export async function trafficSummary(days = 30) {
  const series = await data.daily()
  const cur = series.slice(-days)
  const prev = series.slice(-days * 2, -days)
  const sum = (pts: typeof cur, k: 'visitors' | 'clicks' | 'downloads' | 'impressions') => pts.reduce((s, p) => s + p[k], 0)
  const row = (k: 'visitors' | 'clicks' | 'downloads' | 'impressions') => ({
    value: sum(cur, k),
    previous: sum(prev, k),
    changePct: pct(sum(cur, k) - sum(prev, k), sum(prev, k)),
  })
  const sources = await data.sources()
  const geo = (await data.geography()).slice(0, 5)
  return {
    periodDays: days,
    visitors: row('visitors'),
    impressions: row('impressions'),
    clicks: row('clicks'),
    downloads: row('downloads'),
    clickToInstallPct: pct(sum(cur, 'downloads'), sum(cur, 'clicks')),
    topSources: sources.map((s) => ({ source: s.source, sharePct: +(s.share * 100).toFixed(1), changePct: s.change })),
    topCountriesByShare: geo.map((g) => ({ country: g.name, visitorSharePct: +(g.visitors * 100).toFixed(1) })),
  }
}

export async function campaignPerformance(filter: { clientId?: string; campaignId?: string; status?: string } = {}) {
  const all = await data.campaigns()
  return all
    .filter((c) => (!filter.clientId || c.clientId === filter.clientId) && (!filter.campaignId || c.id === filter.campaignId) && (!filter.status || c.status === filter.status))
    .map(campaignMetrics)
}

/** Rule-based diagnosis: what to fix or try next for a client, with the evidence behind each item. */
export async function growthOpportunities(clientId: string) {
  const [clients, apps, camps] = await Promise.all([data.clients(), data.apps(), data.campaigns()])
  const client = clients.find((c) => c.id === clientId)
  if (!client) throw new Error(`Unknown client ${clientId}`)
  const clientApps = apps.filter((a) => a.clientId === clientId)
  const metrics = camps.filter((c) => c.clientId === clientId).map(campaignMetrics)
  const ideas: Array<{ priority: 'high' | 'medium' | 'low'; area: string; finding: string; action: string }> = []

  for (const m of metrics.filter((x) => x.status === 'active')) {
    if (m.ctrPct < 15) ideas.push({ priority: 'high', area: 'Creative', finding: `${m.name}: CTR ${m.ctrPct}% (below 15%)`, action: 'Refresh the card headline and screenshot; lead with the strongest benefit.' })
    if (m.conversionPct < 30) ideas.push({ priority: 'high', area: 'Listing', finding: `${m.name}: click→install ${m.conversionPct}%`, action: 'Tighten the app page: clearer “why you’ll like it”, reward above the fold, fewer steps to store.' })
    const behind = m.targetProgressPct + 10 < m.budgetUsedPct
    if (behind) ideas.push({ priority: 'medium', area: 'Pacing', finding: `${m.name}: ${m.budgetUsedPct}% budget used for ${m.targetProgressPct}% of target`, action: 'Shift budget toward the best-converting country/source; pause the weakest geo.' })
  }
  const covered = new Set(camps.filter((c) => c.clientId === clientId && ['active', 'scheduled'].includes(c.status)).map((c) => c.appId))
  for (const a of clientApps.filter((x) => x.status === 'live' && !covered.has(x.id))) {
    ideas.push({ priority: 'medium', area: 'Coverage', finding: `${a.name} is live but has no active or scheduled campaign`, action: 'Launch a starter campaign; it already earns organic visits.' })
  }
  if (!ideas.length) ideas.push({ priority: 'low', area: 'Scale', finding: 'All active campaigns are on target', action: 'Test one new country with 10% of budget.' })
  return { client: { id: client.id, name: client.name, tier: client.tier }, apps: clientApps.map((a) => ({ id: a.id, name: a.name, category: a.category, rating: a.rating, weeklyGrowthPct: a.weeklyGrowth })), campaigns: metrics, ideas }
}

export async function recommendApps(signals: VisitorSignals, limit = 6) {
  const [apps, camps] = await Promise.all([data.apps(), data.campaigns()])
  return recommend(apps, camps, signals, limit).map((r) => ({
    appId: r.app.id,
    name: r.app.name,
    category: r.app.category,
    url: `/app/${r.app.slug}`,
    score: +r.score.toFixed(3),
    sponsored: r.sponsored,
    reasons: r.reasons,
  }))
}

export async function clientBrief(clientId: string) {
  const [clients, apps] = await Promise.all([data.clients(), data.apps()])
  const client = clients.find((c) => c.id === clientId)
  if (!client) throw new Error(`Unknown client ${clientId}`)
  return {
    client: { id: client.id, name: client.name, industry: client.industry, country: client.country },
    apps: apps
      .filter((a) => a.clientId === clientId && a.status === 'live')
      .map((a) => ({ id: a.id, name: a.name, tagline: a.tagline, category: a.category, benefits: a.benefits, features: a.features.map((f) => f.title), reward: a.reward ?? null, rating: a.rating, url: `/app/${a.slug}` })),
  }
}
