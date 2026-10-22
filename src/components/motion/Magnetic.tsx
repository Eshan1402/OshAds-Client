import { useRef, type ReactNode } from 'react'
import { ALLOW_MOTION, gsap, useGSAP } from '@/lib/gsap'

/**
 * Magnetic hover for primary CTAs: the child drifts a few px toward the cursor and
 * springs back on leave. Transform-only (no layout shift); fine pointers with motion allowed.
 */
export function Magnetic({ children, strength = 0.18, max = 6 }: { children: ReactNode; strength?: number; max?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      const mm = gsap.matchMedia()
      mm.add(`${ALLOW_MOTION} and (hover: hover) and (pointer: fine)`, () => {
        const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
        const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })
        const clamp = gsap.utils.clamp(-max, max)
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect()
          xTo(clamp((e.clientX - (r.left + r.width / 2)) * strength))
          yTo(clamp((e.clientY - (r.top + r.height / 2)) * strength))
        }
        const leave = () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.45)' })
        }
        el.addEventListener('pointermove', move)
        el.addEventListener('pointerleave', leave)
        return () => {
          el.removeEventListener('pointermove', move)
          el.removeEventListener('pointerleave', leave)
          gsap.set(el, { clearProps: 'transform' })
        }
      })
      return () => mm.revert()
    },
    { scope: ref },
  )
  return (
    <span ref={ref} className="inline-flex will-change-transform">
      {children}
    </span>
  )
}
