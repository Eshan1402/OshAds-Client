import { motion } from 'framer-motion'
import { useCallback, useEffect, useRef, type PointerEvent, type ReactNode } from 'react'
import { useMediaQuery, usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { cn } from '@/utils/cn'

const RADIUS = 170 // px around the pointer that letters react to
const ease = [0.16, 1, 0.3, 1] as const

/**
 * Hero headline: the plain words rise in, letters lift under the pointer (via --p on .hero-letter),
 * and the accent line tilts towards it (via --rx/--ry on .hero-tilt). Fine pointers only; reduced motion off.
 */
export function InteractiveHeadline({ words, accent, label, className }: { words: string[]; accent: ReactNode; label: string; className?: string }) {
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
  const reduced = usePrefersReducedMotion()
  const enabled = finePointer && !reduced
  const root = useRef<HTMLHeadingElement>(null)
  const letters = useRef<HTMLSpanElement[]>([])
  const centres = useRef<Array<{ x: number; y: number }>>([])
  const tilt = useRef<HTMLSpanElement>(null)
  const raf = useRef(0)

  const measure = useCallback(() => {
    const box = root.current?.getBoundingClientRect()
    if (!box) return
    centres.current = letters.current.map((el) => {
      const r = el.getBoundingClientRect()
      return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top }
    })
  }, [])

  useEffect(() => {
    if (!enabled) return
    const t = setTimeout(measure, 1200)
    document.fonts?.ready.then(measure)
    window.addEventListener('resize', measure)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', measure)
      cancelAnimationFrame(raf.current)
    }
  }, [enabled, measure])

  const onMove = (e: PointerEvent<HTMLHeadingElement>) => {
    if (!enabled || e.pointerType !== 'mouse') return
    const box = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - box.left
    const py = e.clientY - box.top
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      letters.current.forEach((el, i) => {
        const c = centres.current[i]
        if (!c) return
        const d = Math.hypot(px - c.x, (py - c.y) * 1.4)
        const t = Math.max(0, 1 - d / RADIUS)
        el.style.setProperty('--p', (t * t * (3 - 2 * t)).toFixed(3))
      })
      const el = tilt.current
      if (el) {
        const r = el.getBoundingClientRect()
        const rx = (e.clientX - (r.left + r.width / 2)) / r.width
        const ry = (e.clientY - (r.top + r.height / 2)) / Math.max(r.height, 1)
        const hot = Math.abs(rx) < 0.75 && Math.abs(ry) < 1.6
        el.style.setProperty('--rx', `${hot ? (-ry * 10).toFixed(2) : 0}deg`)
        el.style.setProperty('--ry', `${hot ? (rx * 14).toFixed(2) : 0}deg`)
        el.dataset.hot = hot ? 'true' : 'false'
      }
    })
  }

  const onLeave = () => {
    cancelAnimationFrame(raf.current)
    letters.current.forEach((el) => el.style.setProperty('--p', '0'))
    const el = tilt.current
    if (el) {
      el.style.setProperty('--rx', '0deg')
      el.style.setProperty('--ry', '0deg')
      el.dataset.hot = 'false'
    }
  }

  let n = 0
  letters.current = []
  return (
    <h1 ref={root} id="hero-title" aria-label={label} onPointerMove={onMove} onPointerEnter={measure} onPointerLeave={onLeave} className={cn('relative', className)}>
      <span className="block" aria-hidden>
        {words.map((word, wi) => (
          <span key={word} className="inline-block overflow-hidden pb-[0.1em] pt-[0.2em] align-bottom [margin-bottom:-0.1em] [margin-top:-0.2em]">
            <motion.span className="inline-block" initial={{ y: '110%', rotate: 4 }} animate={{ y: '0%', rotate: 0 }} transition={{ duration: 0.9, delay: 0.1 + wi * 0.08, ease }}>
              {Array.from(word).map((ch, ci) => {
                const idx = n++
                return (
                  <span
                    key={ci}
                    ref={(el) => {
                      if (el) letters.current[idx] = el
                    }}
                    className="hero-letter inline-block"
                  >
                    {ch}
                  </span>
                )
              })}
            </motion.span>
            {wi < words.length - 1 && ' '}
          </span>
        ))}
      </span>
      <motion.span
        className="mt-1 block [perspective:900px]"
        initial={{ opacity: 0, y: 24, filter: 'blur(12px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 1, delay: 0.3, ease }}
        aria-hidden
      >
        <span ref={tilt} className="hero-tilt inline-block origin-center" data-hot="false">
          {accent}
        </span>
      </motion.span>
    </h1>
  )
}
