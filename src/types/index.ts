// Domain model shared by the mock service layer and the UI.
// Shapes mirror what a REST/GraphQL backend is expected to return.

export type ID = string

export type Platform = 'ios' | 'android'

export type CategorySlug =
  | 'loans'
  | 'betting'
  | 'trading'
  | 'crypto'
  | 'banking'
  | 'insurance'
  | 'food'
  | 'social'
  | 'mobility'
  | 'finance'
  | 'shopping'
  | 'gaming'
  | 'productivity'
  | 'education'
  | 'entertainment'
  | 'lifestyle'
  | 'utilities'
  | 'health'
  | 'travel'
  | 'ai'
  | 'business'

export interface Category {
  slug: CategorySlug
  name: string
  description: string
  icon: string
  /** Two-stop gradient used for the category's visual identity. */
  colors: [string, string]
}

export type ScreenArchetype = 'ledger' | 'grid' | 'game' | 'list' | 'media' | 'rings' | 'map' | 'chat'

export type CampaignBadge = 'Featured' | 'Exclusive' | 'New' | 'Trending' | 'Reward' | 'Editor’s pick'

export interface AppFeature {
  icon: string
  title: string
  description: string
}

export type AppStatus = 'live' | 'draft' | 'paused' | 'in_review'

export interface MobileApp {
  id: ID
  slug: string
  name: string
  tagline: string
  description: string
  category: CategorySlug
  clientId: ID
  developer: string
  platforms: Platform[]
  rating: number
  ratingCount: number
  /** Share of ratings for 5★ → 1★, sums to 1. */
  ratingDistribution: [number, number, number, number, number]
  downloads: number
  size: string
  version: string
  updatedAt: string
  ageRating: string
  icon: string
  colors: [string, string]
  archetype: ScreenArchetype
  screenshots: number
  features: AppFeature[]
  benefits: string[]
  tags: string[]
  badge?: CampaignBadge
  reward?: string
  trendingRank?: number
  weeklyGrowth: number
  appStoreUrl?: string
  playStoreUrl?: string
  trackingUrl: string
  status: AppStatus
  /** Data URL of an uploaded icon, overrides the generated icon. */
  iconImage?: string
  /** Uploaded screenshot images (data URLs or CDN URLs once a backend exists). */
  screenshotImages?: string[]
  /** Brand's official website and LinkedIn page. */
  website?: string
  linkedinUrl?: string
}

export type ClientStatus = 'active' | 'onboarding' | 'paused' | 'churned'

export interface Client {
  id: ID
  name: string
  company: string
  contactName: string
  contactEmail: string
  industry: string
  country: string
  logoColors: [string, string]
  status: ClientStatus
  since: string
  tier: 'Enterprise' | 'Growth' | 'Starter'
  accountManagerId: ID
  website?: string
  linkedinUrl?: string
  /** Square logo image URL; falls back to initials on logoColors. */
  logo?: string
}

export type CampaignStatus = 'active' | 'paused' | 'scheduled' | 'completed' | 'archived' | 'draft'
export type PayoutModel = 'CPI' | 'CPA' | 'CPC' | 'CPM'

export interface CampaignTargeting {
  countries: string[]
  platforms: Platform[]
  ageRange: [number, number]
  interests: string[]
  devices: Array<'phone' | 'tablet'>
}

export interface CampaignTracking {
  trackingUrl: string
  postbackUrl: string
  attributionPartner: 'AppsFlyer' | 'Adjust' | 'Branch' | 'Singular' | 'Kochava' | 'None'
  utmSource: string
  utmCampaign: string
  attributionWindowDays: number
}

export interface Campaign {
  id: ID
  name: string
  objective: 'installs' | 'engagement' | 'reactivation' | 'awareness'
  clientId: ID
  appId: ID
  status: CampaignStatus
  startDate: string
  endDate: string
  budget: number
  spent: number
  payoutModel: PayoutModel
  bid: number
  targetInstalls: number
  dailyCap: number
  impressions: number
  clicks: number
  downloads: number
  revenue: number
  targeting: CampaignTargeting
  tracking: CampaignTracking
  sources: string[]
  createdAt: string
  createdBy: ID
  notes?: string
}

export type Role = 'admin' | 'manager' | 'analyst'

export type Permission =
  | 'analytics:read'
  | 'campaigns:write'
  | 'apps:write'
  | 'clients:write'
  | 'reports:export'
  | 'settings:manage'
  | 'team:manage'

export interface User {
  id: ID
  name: string
  email: string
  role: Role
  title: string
  avatarColor: string
}

export interface Session {
  user: User
  expiresAt: number
}

export interface TimePoint {
  date: string
  visitors: number
  sessions: number
  impressions: number
  clicks: number
  downloads: number
  revenue: number
}

export type MetricKey = 'visitors' | 'sessions' | 'clicks' | 'downloads' | 'impressions' | 'revenue'

export type RangeKey = 'today' | '7d' | '30d' | '90d' | '1y' | 'custom'

export interface DateRange {
  key: RangeKey
  from: string
  to: string
}

/** Real counts from the first-party events server — not sample data. */
export interface MeasuredTraffic {
  from: string
  to: string
  /** Unique visitors per day, summed over the range (cookieless, so a returning visitor counts once per day). */
  visitors: number
  pageViews: number
  appViews: number
  downloadClicks: number
  daily: Array<{ day: string; visitors: number; pageViews: number; appViews: number; downloadClicks: number }>
  apps: Array<{ appId: string; name: string; views: number; downloads: number }>
  sources: Array<{ source: string; visitors: number; downloads: number }>
}

export interface KpiSummary {
  key: string
  label: string
  value: number
  previous: number
  format: 'number' | 'percent' | 'currency'
  spark: number[]
}

export interface SourceBreakdown {
  source: string
  visitors: number
  downloads: number
  share: number
  change: number
}

export interface GeoCity {
  name: string
  visitors: number
  downloads: number
}
export interface GeoRegion {
  name: string
  visitors: number
  downloads: number
  cities: GeoCity[]
}
export interface GeoCountry {
  code: string
  name: string
  flag: string
  visitors: number
  downloads: number
  regions: GeoRegion[]
}

export interface DeviceBreakdown {
  device: 'Android' | 'iOS' | 'Desktop' | 'Tablet'
  users: number
  downloads: number
  share: number
}

export interface OsVersion {
  name: string
  share: number
  users: number
}

export type NotificationKind = 'milestone' | 'performance' | 'budget' | 'system' | 'client' | 'completed'

export interface AppNotification {
  id: ID
  kind: NotificationKind
  title: string
  body: string
  createdAt: string
  read: boolean
  href?: string
  severity: 'info' | 'success' | 'warning' | 'critical'
}

export interface ActivityItem {
  id: ID
  actor: string
  action: string
  target: string
  href?: string
  at: string
}

export interface SystemService {
  name: string
  status: 'operational' | 'degraded' | 'outage'
  latencyMs: number
}

export interface ReferralDomain {
  domain: string
  visitors: number
  downloads: number
  change: number
}
export interface OrganicKeyword {
  keyword: string
  clicks: number
  position: number
  change: number
}

export type ReportType = 'campaign' | 'client' | 'application' | 'traffic' | 'downloads'

export interface SavedReport {
  id: ID
  name: string
  type: ReportType
  range: string
  createdAt: string
  createdBy: string
  format: 'CSV' | 'PDF'
  schedule?: 'Daily' | 'Weekly' | 'Monthly'
}
