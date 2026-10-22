import { animate, useInView, useMotionValue } from 'framer-motion'
import { memo, useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'

/** Counts up to `value` when scrolled into view; respects reduced motion. */
export const AnimatedCounter = memo(function AnimatedCounter({
  value,
  format = (n) => Math.round(n).toLocaleString('en-US'),
  duration = 1.1,
  className,
}: {
  value: number
  format?: (n: number) => string
  duration?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduced = usePrefersReducedMotion()
  const mv = useMotionValue(0)
  const started = useRef(false)

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      if (ref.current) ref.current.textContent = format(value)
      return
    }
    const from = started.current ? mv.get() : 0
    started.current = true
    const controls = animate(from, value, {
      duration: from === 0 ? duration : 0.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        mv.set(v)
        if (ref.current) ref.current.textContent = format(v)
      },
    })
    return () => controls.stop()
  }, [inView, value, reduced, duration, format, mv])

  return (
    <span ref={ref} className={className}>
      {format(reduced ? value : 0)}
    </span>
  )
})
