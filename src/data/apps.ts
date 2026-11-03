import type { CategorySlug, MobileApp } from '@/types'
import { slugify } from '@/utils/format'
import { brands } from './brands'
import { categoryBySlug } from './categories'

const host = (url: string) => new URL(url).hostname.replace(/^www\./, '')
const LISTED_ON = '2026-10-21'
export const REWARD_COINS = 20

const ADULT: CategorySlug[] = ['loans', 'betting', 'trading', 'crypto']
/** Listings that ask visitors to confirm they're 18+ before showing details or opening the app. */
export const AGE_GATED: CategorySlug[] = ['betting', 'loans']
export const AGE_KEY = 'osh:age18'
// Plain risk lines, shown as part of the listing text — accurate labelling, not an age gate.
const NOTICE: Partial<Record<CategorySlug, string>> = {
  loans: 'Check eligibility, interest rates, fees and repayment terms on the official website before you apply.',
  betting: '18+ only. Gambling can be addictive — please play responsibly and check it is legal where you live.',
  trading: 'Trading forex and CFDs carries a high risk of losing money.',
  crypto: 'Crypto prices are volatile and you can lose money.',
}

/**
 * One listing per client. Only supplied facts are filled in: name, website, LinkedIn, market, logo.
 * Ratings, downloads, store links and screenshots stay empty until real data is added in the dashboard,
 * and the site hides whatever is empty instead of showing made-up numbers.
 */
export const apps: MobileApp[] = brands.map((b) => {
  const slug = slugify(b.name)
  const cat = categoryBySlug[b.category]
  return {
    id: `app_${slug}`,
    slug,
    name: b.name,
    tagline: `${cat.name} · ${host(b.website)}`,
    description: [
      `${b.name} is listed in ${cat.name} on OshAds${b.country ? ` for ${b.country}` : ''}.`,
      NOTICE[b.category] ?? 'Visit the official website to learn more.',
    ].join(' '),
    category: b.category,
    clientId: `cl_${slug}`,
    developer: b.name,
    platforms: [],
    rating: 0,
    ratingCount: 0,
    ratingDistribution: [0, 0, 0, 0, 0],
    downloads: 0,
    size: '',
    version: '',
    updatedAt: LISTED_ON,
    ageRating: ADULT.includes(b.category) ? '18+' : '',
    icon: cat.icon,
    colors: cat.colors,
    archetype: 'ledger',
    screenshots: 0,
    features: [],
    benefits: [],
    tags: [cat.name.toLowerCase(), ...(b.country ? [b.country.toLowerCase()] : [])],
    reward: `${REWARD_COINS} Osh coins`,
    weeklyGrowth: 0,
    trackingUrl: b.website,
    status: 'live',
    website: b.website,
    linkedinUrl: b.linkedin,
    iconImage: b.logo,
  }
})
