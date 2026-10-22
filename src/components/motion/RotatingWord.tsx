import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { cn } from '@/utils/cn'

const GRADIENT = 'linear-gradient(90deg,var(--grad-2) 0%,var(--grad-3) 25%,var(--grad-4) 50%,var(--grad-3) 75%,var(--grad-2) 100%)'
const GRADIENT_WIDTH = 640 // matches the text-flow keyframes in index.css

const letter: Variants = {
  hidden: { y: '0.45em', opacity: 0, filter: 'blur(10px)', rotateX: -70 },
  show: { y: '0em', opacity: 1, filter: 'blur(0px)', rotateX: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
  exit: { y: '-0.35em', opacity: 0, filter: 'blur(8px)', transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } },
}

/** Cycles through words with a letter-by-letter swap, a drawn swash underline and a sparkle. Pauses on hover. */
export function RotatingWord({ words, interval = 2800, className }: { words: string[]; interval?: number; className?: string }) {
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (reduced || paused) return
    const t = setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % words.length)
    }, interval)
    return () => clearInterval(t)
  }, [reduced, paused, interval, words.length])
  const word = words[index]
  return (
    <span className={cn('relative inline-grid align-baseline', className)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* Every word laid out invisibly in the same cell, so the width never jumps. */}
      {words.map((w) => (
        <span key={w} className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden>
          {w}
        </span>
      ))}
      <span className="relative col-start-1 row-start-1 justify-self-start whitespace-nowrap" aria-hidden>
        <AnimatePresence mode="popLayout" initial={false}>
          <FlowingWord key={word} text={word} animate={!reduced} />
        </AnimatePresence>
        <Swash key={`swash-${word}`} animate={!reduced} />
      </span>
    </span>
  )
}

/** Letters share one moving gradient: each letter offsets the background by its own position. */
function FlowingWord({ text, animate }: { text: string; animate: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [offsets, setOffsets] = useState<number[]>([])
  const chars = Array.from(text)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const left = el.getBoundingClientRect().left
      setOffsets(Array.from(el.querySelectorAll<HTMLElement>('[data-ch]')).map((c) => c.offsetLeft || c.getBoundingClientRect().left - left))
    }
    measure()
    document.fonts?.ready.then(measure)
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [text])
  return (
    <motion.span
      ref={ref}
      className={cn('relative inline-block [perspective:600px]', animate && 'animate-text-flow')}
      initial={animate ? 'hidden' : false}
      animate="show"
      exit="exit"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035, delayChildren: 0.12 } }, exit: { transition: { staggerChildren: 0.018 } } }}
    >
      {chars.map((ch, i) => (
        <motion.span
          key={i}
          data-ch
          variants={animate ? letter : undefined}
          className="inline-block bg-clip-text text-transparent [-webkit-background-clip:text]"
          style={{
            backgroundImage: GRADIENT,
            backgroundRepeat: 'repeat-x',
            backgroundSize: `${GRADIENT_WIDTH}px 100%`,
            backgroundPositionX: `calc(${-(offsets[i] ?? 0)}px + var(--flow, 0px))`,
            whiteSpace: 'pre',
          }}
        >
          {ch}
        </motion.span>
      ))}
    </motion.span>
  )
}

function Swash({ animate }: { animate: boolean }) {
  return (
    <span className="pointer-events-none absolute -bottom-[0.14em] left-[2%] h-[0.32em] w-[96%]" aria-hidden>
      <svg viewBox="0 0 300 24" preserveAspectRatio="none" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id="hero-swash" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#1B3FD0" stopOpacity="0.15" />
            <stop offset="0.45" stopColor="#3D7BFF" stopOpacity="0.85" />
            <stop offset="1" stopColor="#7CC4FF" />
          </linearGradient>
        </defs>
        <motion.path
          d="M4 16 C 60 6, 120 4, 170 9 S 260 18, 296 7"
          fill="none"
          stroke="url(#hero-swash)"
          strokeWidth="3.2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={animate ? { pathLength: 0, opacity: 0 } : false}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.45, ease: [0.65, 0, 0.35, 1] }}
        />
      </svg>
      <motion.svg
        viewBox="0 0 24 24"
        className="absolute -right-[0.18em] -top-[0.42em] size-[0.42em] text-[#7CC4FF]"
        initial={animate ? { scale: 0, rotate: -90, opacity: 0 } : false}
        animate={animate ? { scale: [0, 1.15, 1], rotate: 0, opacity: 1 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <motion.path
          d="M12 0 C12.6 7.4 16.6 11.4 24 12 C16.6 12.6 12.6 16.6 12 24 C11.4 16.6 7.4 12.6 0 12 C7.4 11.4 11.4 7.4 12 0 Z"
          fill="currentColor"
          animate={animate ? { opacity: [1, 0.45, 1], scale: [1, 0.82, 1] } : undefined}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }}
          style={{ transformOrigin: 'center' }}
        />
      </motion.svg>
    </span>
  )
}
