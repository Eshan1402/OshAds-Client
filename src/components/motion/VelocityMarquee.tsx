import { motion, useAnimationFrame, useMotionValue, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion'
import { useRef } from 'react'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'

const wrap = (min: number, max: number, v: number) => {
  const r = max - min
  return ((((v - min) % r) + r) % r) + min
}

/** Oversized kinetic type whose speed and direction follow scroll velocity. */
export function VelocityMarquee({ words, baseVelocity = -2 }: { words: string[]; baseVelocity?: number }) {
  const reduced = usePrefersReducedMotion()
  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 })
  const factor = useTransform(smooth, [0, 1000], [0, 5], { clamp: false })
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`)
  const dir = useRef(1)

  useAnimationFrame((_, delta) => {
    if (reduced) return
    let move = dir.current * baseVelocity * (delta / 1000)
    const f = factor.get()
    if (f < 0) dir.current = -1
    else if (f > 0) dir.current = 1
    move += dir.current * move * Math.abs(f)
    baseX.set(baseX.get() + move)
  })

  const row = (
    <>
      {words.map((w, i) => (
        <span key={i} className="flex items-center gap-[0.35em] pr-[0.35em]">
          <span
            className={
              i % 2
                ? 'font-serif font-normal italic text-gradient-brand'
                : 'font-display font-extrabold tracking-[-0.05em] text-transparent [-webkit-text-stroke:1.5px_var(--line-strong)]'
            }
          >
            {w}
          </span>
          <span className="inline-block size-[0.22em] rounded-full bg-[linear-gradient(135deg,#1B3FD0,#3D7BFF)]" />
        </span>
      ))}
    </>
  )

  return (
    <div className="overflow-hidden py-6 sm:py-10" aria-label={words.join(', ')} role="img">
      <motion.div style={{ x }} className="flex w-max whitespace-nowrap text-[17vw] leading-[0.9] sm:text-[12vw]" aria-hidden>
        {row}
        {row}
        {row}
        {row}
      </motion.div>
    </div>
  )
}
