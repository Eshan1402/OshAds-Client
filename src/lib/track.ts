/** Sends anonymous traffic events to the first-party counter (server/events.ts). No cookies, no IDs on the device. */
export type TrackEvent = 'page_view' | 'app_view'

const ENDPOINT = import.meta.env.VITE_EVENTS_URL ?? '/api/events'
let last = { key: '', at: 0 }

const optedOut = () => {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  return !!nav.globalPrivacyControl || nav.doNotTrack === '1'
}
// Staff using the dashboard aren't audience.
const isStaffPage = () => location.pathname.startsWith('/dashboard')

/** utm_source wins, then the external referrer's host, else "direct". */
export function source() {
  const utm = new URLSearchParams(location.search).get('utm_source')
  if (utm) return utm
  try {
    const host = new URL(document.referrer).hostname
    return host && host !== location.hostname ? host.replace(/^www\./, '') : 'direct'
  } catch {
    return 'direct'
  }
}

function send(payload: Record<string, unknown>) {
  const body = JSON.stringify({ ...payload, path: location.pathname, source: source() })
  try {
    if (navigator.sendBeacon?.(ENDPOINT, body)) return
  } catch {
    /* fall through to fetch */
  }
  fetch(ENDPOINT, { method: 'POST', body, keepalive: true }).catch(() => {})
}

export function track(type: TrackEvent, appId?: string) {
  if (optedOut()) return
  // StrictMode and quick re-renders fire effects twice; one event per action per second.
  const key = `${type}|${appId ?? ''}|${location.pathname}`
  if (key === last.key && Date.now() - last.at < 1000) return
  last = { key, at: Date.now() }
  send({ type, appId })
}

/* Impressions: each app card counts once per page view, sent in one batch. */
const pending = new Set<string>()
const seen = new Set<string>()
let seenPath = ''
let timer = 0

function flush() {
  window.clearTimeout(timer)
  if (!pending.size) return
  send({ type: 'impression', appIds: [...pending] })
  pending.clear()
}
if (typeof window !== 'undefined') window.addEventListener('pagehide', flush)

export function trackImpression(appId: string) {
  if (optedOut() || isStaffPage()) return
  if (location.pathname !== seenPath) {
    flush()
    seen.clear()
    seenPath = location.pathname
  }
  if (seen.has(appId)) return
  seen.add(appId)
  pending.add(appId)
  window.clearTimeout(timer)
  timer = window.setTimeout(flush, 1500)
}
