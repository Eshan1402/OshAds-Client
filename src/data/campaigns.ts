import type { Campaign, CampaignStatus, PayoutModel, Platform } from '@/types'
import { addDays, toISODate } from '@/utils/format'
import { createRandom, hashString } from '@/utils/random'
import { apps } from './apps'

interface CampaignSeed {
  name: string
  appId: string
  status: CampaignStatus
  /** Start offset in days relative to today. */
  start: number
  durationDays: number
  budget: number
  payout: PayoutModel
  objective?: Campaign['objective']
  countries: string[]
}

// No campaigns yet: create real ones for the small-loan clients in Dashboard → Campaigns.
const seeds: CampaignSeed[] = []

const today = new Date()
const allSources = ['Organic Search', 'Direct', 'Referral', 'Social', 'Partner', 'Campaign']

export const campaigns: Campaign[] = seeds.map((s, i) => {
  const app = apps.find((a) => a.id === s.appId)!
  const rnd = createRandom(hashString(s.name))
  // Budgets are sized so campaign delivery reconciles with owned-site traffic volume.
  const budget = Math.max(2500, Math.round((s.budget * 0.18) / 500) * 500)
  const start = addDays(today, s.start)
  const end = addDays(start, s.durationDays)
  const elapsed = Math.max(0, Math.min(1, -s.start / s.durationDays))
  const progress = s.status === 'completed' ? 1 : s.status === 'scheduled' || s.status === 'draft' ? 0 : elapsed
  const bid = s.payout === 'CPC' ? rnd.range(0.18, 0.45) : s.payout === 'CPA' ? rnd.range(2.4, 5.8) : rnd.range(0.9, 2.6)
  const spent = Math.round(budget * progress * rnd.range(0.78, 1.0))
  const downloads = s.payout === 'CPC' ? Math.round((spent / bid) * rnd.range(0.2, 0.32)) : Math.round(spent / bid)
  const clicks = Math.round(downloads / rnd.range(0.24, 0.46))
  const impressions = Math.round(clicks / rnd.range(0.16, 0.31))
  const platforms: Platform[] = app.platforms
  const id = `CMP-${(1041 + i).toString()}`
  return {
    id,
    name: `${app.name} — ${s.name}`,
    objective: s.objective ?? 'installs',
    clientId: app.clientId,
    appId: app.id,
    status: s.status,
    startDate: toISODate(start),
    endDate: toISODate(end),
    budget,
    spent,
    payoutModel: s.payout,
    bid: Math.round(bid * 100) / 100,
    targetInstalls: Math.round((budget / bid) * (s.payout === 'CPC' ? 0.26 : 1)),
    dailyCap: Math.round(budget / s.durationDays),
    impressions,
    clicks,
    downloads,
    revenue: Math.round(spent * rnd.range(1.18, 1.42)),
    targeting: {
      countries: s.countries,
      platforms,
      ageRange: [rnd.pick([18, 18, 21, 25]), rnd.pick([34, 44, 54, 65])],
      interests: app.tags.slice(0, 3),
      devices: rnd.next() > 0.3 ? ['phone', 'tablet'] : ['phone'],
    },
    tracking: {
      trackingUrl: `${app.trackingUrl}&cid=${id}`,
      postbackUrl: `https://pb.oshads.com/v2/postback?cid=${id}&click_id={click_id}&event={event}`,
      attributionPartner: rnd.pick(['AppsFlyer', 'Adjust', 'Branch', 'Singular'] as const),
      utmSource: 'oshads',
      utmCampaign: id.toLowerCase(),
      attributionWindowDays: rnd.pick([7, 7, 14, 30]),
    },
    sources: allSources.filter(() => rnd.next() > 0.35).concat('Campaign').filter((v, idx, arr) => arr.indexOf(v) === idx),
    createdAt: toISODate(addDays(start, -rnd.int(5, 20))),
    createdBy: 'u_priya',
  }
})
