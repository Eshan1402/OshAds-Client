import { Cookie } from 'lucide-react'
import { useEffect, useState } from 'react'

const KEY = 'osh:consent'
const OPEN_EVENT = 'osh:cookie-settings'

const readChoice = () => {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return 'denied' // storage blocked: don't nag on every page
  }
}
// Browsers that already say "don't track me" are treated as a decline and never asked.
const signalsOptOut = () => {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  return !!nav.globalPrivacyControl || nav.doNotTrack === '1'
}

/** Reopens the banner (footer "Cookie settings" link). */
export const openCookieSettings = () => window.dispatchEvent(new Event(OPEN_EVENT))

/**
 * Asks once whether we may set a first-party cookie that recognises returning visitors.
 * The server sets or clears the cookie (httpOnly); without it, counting stays cookieless.
 */
export function CookieConsent() {
  const [open, setOpen] = useState(() => !readChoice() && !signalsOptOut())
  useEffect(() => {
    const show = () => setOpen(true)
    window.addEventListener(OPEN_EVENT, show)
    return () => window.removeEventListener(OPEN_EVENT, show)
  }, [])

  const choose = (accept: boolean) => {
    try {
      localStorage.setItem(KEY, accept ? 'granted' : 'denied')
    } catch {
      /* the server cookie still reflects the choice */
    }
    fetch('/api/consent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accept }) }).catch(() => {})
    setOpen(false)
  }

  if (!open) return null
  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"
    >
      <div className="glass-strong mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl p-4 shadow-xl sm:flex-row sm:items-center sm:gap-5">
        <Cookie className="hidden size-6 shrink-0 text-accent-text sm:block" aria-hidden />
        <p className="flex-1 text-[13px] leading-relaxed text-muted">
          <span className="font-semibold text-fg">Can we remember you?</span> One cookie from OshAds (no ad or third-party cookies) lets us tell when you
          come back, so we can count real visitors and improve the site. Decline and we still count visits, just without recognising you.
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => choose(false)} className="h-10 flex-1 rounded-full border border-line px-4 text-sm font-medium text-fg transition hover:bg-surface-2 sm:flex-none">
            Decline
          </button>
          <button type="button" onClick={() => choose(true)} className="h-10 flex-1 rounded-full bg-fg px-5 text-sm font-semibold text-bg transition active:scale-[0.97] sm:flex-none">
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
