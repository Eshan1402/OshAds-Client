/**
 * Gives every listed app that has no campaign yet an always-on, active campaign, so it's live and featured.
 * Budget and bid are $0 ("no cap set yet"): managers fill in the real numbers and tracking link on the campaign.
 * Safe to run again: apps that already have any campaign are skipped.
 *
 *   npm run campaigns:live                                  (local)
 *   docker compose exec app npm run campaigns:live          (on the server)
 */
import { allDocs, putDoc } from '../server/db'
import type { Campaign, MobileApp } from '../src/types'

const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10)
const campaigns = allDocs<Campaign>('campaigns')
const covered = new Set(campaigns.map((c) => c.appId))
let next = Math.max(1000, ...campaigns.map((c) => Number(c.id.replace(/\D/g, '')) || 0)) + 1
let made = 0

for (const app of allDocs<MobileApp>('apps')) {
  if (app.status !== 'live' || covered.has(app.id)) continue
  const id = `CMP-${next++}`
  const campaign: Campaign = {
    id,
    name: `${app.name} — Always on`,
    objective: 'installs',
    clientId: app.clientId,
    appId: app.id,
    status: 'active',
    startDate: day(0),
    endDate: day(365),
    budget: 0,
    spent: 0,
    payoutModel: 'CPI',
    bid: 0,
    targetInstalls: 0,
    dailyCap: 0,
    impressions: 0,
    clicks: 0,
    downloads: 0,
    revenue: 0,
    targeting: { countries: [], platforms: app.platforms.length ? app.platforms : ['ios', 'android'], ageRange: [18, 65], interests: [], devices: ['phone', 'tablet'] },
    tracking: { trackingUrl: app.trackingUrl, postbackUrl: '', attributionPartner: 'None', utmSource: 'oshads', utmCampaign: id.toLowerCase(), attributionWindowDays: 7 },
    sources: ['Campaign'],
    createdAt: day(0),
    createdBy: 'u_priya',
  }
  if (putDoc('campaigns', campaign, true) === 'ok') made++
}

console.log(`Created ${made} live campaign${made === 1 ? '' : 's'}. ${covered.size} app${covered.size === 1 ? '' : 's'} already had one.`)
