import { useEffect, useRef } from 'react'
import { trackImpression } from '@/lib/track'

/** Counts an impression the first time at least half of the element is on screen. */
export function useImpression<T extends Element>(appId: string) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        trackImpression(appId)
        io.disconnect()
      },
      { threshold: 0.5 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [appId])
  return ref
}
