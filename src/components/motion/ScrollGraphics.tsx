import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'

/**
 * Line graphics behind the page that turn and drift as the visitor scrolls.
 * Only transforms change, on a handful of small shapes, so scrolling stays cheap (the blurred backdrop stays static).
 */
export function ScrollGraphics() {
  const reduced = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll()
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 })
  const turn = useTransform(p, [0, 1], [0, 420])
  const turnBack = useTransform(p, [0, 1], [0, -300])
  const rise = useTransform(p, [0, 1], ['0vh', '-70vh'])
  const sink = useTransform(p, [0, 1], ['0vh', '55vh'])
  const slide = useTransform(p, [0, 1], ['0vw', '-18vw'])
  const draw = useTransform(p, [0, 1], [0.05, 1])
  if (reduced) return null

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden text-accent" aria-hidden>
      {/* A dashed wheel rolling down the left edge */}
      <motion.svg style={{ rotate: turn, y: sink }} viewBox="0 0 200 200" className="absolute -left-28 top-[18%] size-72 opacity-25 sm:-left-24 sm:size-96">
        <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 9" />
        <circle cx="100" cy="100" r="64" fill="none" stroke="currentColor" strokeWidth="0.6" />
        <circle cx="100" cy="4" r="5" fill="currentColor" />
        <circle cx="164" cy="100" r="3" fill="currentColor" />
      </motion.svg>

      {/* A small orbit climbing the right edge, turning the other way */}
      <motion.svg style={{ rotate: turnBack, y: rise }} viewBox="0 0 200 200" className="absolute -right-20 top-[78%] size-64 opacity-30 sm:size-80">
        <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 6" />
        <circle cx="192" cy="100" r="6" fill="currentColor" />
        <circle cx="50" cy="100" r="4" fill="currentColor" />
      </motion.svg>

      {/* A ring that draws itself as the page is read */}
      <motion.svg style={{ y: rise }} viewBox="0 0 100 100" className="absolute left-[12%] top-[120%] hidden size-40 -rotate-90 opacity-40 md:block">
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.35" />
        <motion.circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{ pathLength: draw }} />
      </motion.svg>

      {/* Small marks at different depths */}
      <motion.svg style={{ rotate: turn, x: slide, y: rise }} viewBox="0 0 24 24" className="absolute right-[16%] top-[58%] size-7 opacity-40">
        <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </motion.svg>
      <motion.div style={{ rotate: turnBack, y: sink }} className="absolute left-[22%] top-[36%] hidden size-5 rounded-[5px] border-2 border-current opacity-30 md:block" />
      <motion.div style={{ y: rise, x: slide }} className="absolute right-[30%] top-[140%] size-3 rounded-full bg-current opacity-40" />
    </div>
  )
}
