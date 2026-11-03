/** Sends anonymous traffic events to the first-party counter (server/events.ts). No cookies, no IDs on the device. */
export type TrackEvent = 'page_view' | 'app_view' | 'game_start' | 'search' | 'filter' | 'page_time' | 'scroll' | 'outbound'

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

/** `label` names what was used (a game, a search term, a category); `value` is a number (seconds, % scrolled). */
export function track(type: TrackEvent, appId?: string, extra: { label?: string; value?: number } = {}) {
  if (optedOut() || isStaffPage()) return
  // StrictMode and quick re-renders fire effects twice; one event per action per second.
  const key = `${type}|${appId ?? ''}|${extra.label ?? ''}|${location.pathname}`
  if (key === last.key && Date.now() - last.at < 1000) return
  last = { key, at: Date.now() }
  send({ type, appId, ...extra })
}

/**
 * Measures one page view: seconds the tab was visible and the deepest point scrolled (%).
 * Returns a stop function that sends both; call it when the route changes. Also sends on tab close.
 */
export function measurePage() {
  let visibleMs = 0
  let since = document.hidden ? 0 : performance.now()
  let deepest = 0
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight
    deepest = Math.max(deepest, max > 0 ? Math.round((scrollY / max) * 100) : 100)
  }
  const onVisibility = () => {
    if (document.hidden) visibleMs += since ? performance.now() - since : 0
    since = document.hidden ? 0 : performance.now()
  }
  let sent = false
  const stop = () => {
    if (sent) return
    sent = true
    onVisibility()
    removeEventListener('scroll', onScroll)
    document.removeEventListener('visibilitychange', onVisibility)
    removeEventListener('pagehide', stop)
    const seconds = Math.round((visibleMs + (since ? performance.now() - since : 0)) / 1000)
    if (seconds >= 1) {
      track('page_time', undefined, { value: seconds })
      track('scroll', undefined, { value: deepest })
    }
  }
  onScroll()
  addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)
  addEventListener('pagehide', stop)
  return stop
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
