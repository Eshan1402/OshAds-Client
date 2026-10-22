import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const instant = 'instant' as ScrollBehavior

export function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: instant })
      return
    }
    // The target may not exist yet (lazy route, data still loading), and charts / ScrollTrigger
    // refreshes shift the layout after mount — a single smooth scroll gets cancelled or lands short.
    // Re-align until the target holds its position for a few frames.
    const id = decodeURIComponent(hash.slice(1))
    let tries = 0
    let stable = 0
    let timer = 0
    const tick = () => {
      const el = document.getElementById(id)
      if (el) {
        const offset = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
        const delta = el.getBoundingClientRect().top - offset
        if (Math.abs(delta) > 2) {
          stable = 0
          window.scrollTo({ top: window.scrollY + delta, behavior: instant })
        } else if (++stable >= 3) return
      }
      if (++tries < 30) timer = window.setTimeout(tick, 100)
    }
    tick()
    return () => window.clearTimeout(timer)
  }, [pathname, hash])
  return null
}
