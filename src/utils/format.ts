const compactFmt = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const numberFmt = new Intl.NumberFormat('en-US')
const currencyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const currencyPreciseFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const formatNumber = (n: number) => numberFmt.format(Math.round(n))
export const formatCompact = (n: number) => compactFmt.format(n)
export const formatCurrency = (n: number) => currencyFmt.format(n)
export const formatCurrencyPrecise = (n: number) => currencyPreciseFmt.format(n)
export const formatPercent = (n: number, digits = 1) => `${n.toFixed(digits)}%`

/** Store-style download label: 1,240,000 → "1M+". */
export function formatDownloads(n: number) {
  const steps = [1e9, 5e8, 1e8, 5e7, 1e7, 5e6, 1e6, 5e5, 1e5, 5e4, 1e4, 5e3, 1e3]
  const step = steps.find((s) => n >= s)
  return step ? `${compactFmt.format(step)}+` : `${n}`
}

export function formatChange(n: number, digits = 1) {
  const sign = n > 0 ? '+' : n < 0 ? '−' : ''
  return `${sign}${Math.abs(n).toFixed(digits)}%`
}

export const pctChange = (current: number, previous: number) =>
  previous === 0 ? 0 : ((current - previous) / previous) * 100

export const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b)

const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const shortDateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

export const formatDate = (iso: string) => dateFmt.format(new Date(iso))
export const formatShortDate = (iso: string) => shortDateFmt.format(new Date(iso))
export const formatTime = (iso: string) => timeFmt.format(new Date(iso))

export function formatRelative(iso: string, now = Date.now()) {
  const diff = (now - new Date(iso).getTime()) / 1000
  if (diff < 45) return 'just now'
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`
  if (diff < 86400 * 7) return `${Math.round(diff / 86400)}d ago`
  return formatShortDate(iso)
}

export const toISODate = (d: Date) => d.toISOString().slice(0, 10)

export function addDays(d: Date, days: number) {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function greeting(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
