import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { cn } from '@/utils/cn'

const GRADIENT = 'linear-gradient(90deg,var(--grad-2) 0%,var(--grad-3) 25%,var(--grad-4) 50%,var(--grad-3) 75%,var(--grad-2) 100%)'
const GRADIENT_WIDTH = 640 // matches the text-flow keyframes in index.css
const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz#%&*?<>/'
const FRAME_MS = 40
const LOCK_START_MS = 160 // first letter settles after this
const LOCK_STEP_MS = 70 // each next letter settles this much later

/** Random glyphs that lock into `target` left to right; non-letters (spaces, punctuation) stay put. */
function scramble(target: string, elapsed: number) {
  return Array.from(target, (ch, i) =>
    elapsed >= LOCK_START_MS + i * LOCK_STEP_MS || !/[a-z]/i.test(ch) ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
  ).join('')
}

/** Shows `target` scrambling into place, plus how far through it is (0..1) for the distortion. */
function useScramble(target: string, enabled: boolean) {
  const [text, setText] = useState(enabled ? '' : target)
  const [progress, setProgress] = useState(enabled ? 0 : 1)
  useEffect(() => {
    if (!enabled) {
      setText(target)
      setProgress(1)
      return
    }
    const start = performance.now()
    const done = LOCK_START_MS + target.length * LOCK_STEP_MS
    const step = () => {
      const elapsed = performance.now() - start
      setText(scramble(target, elapsed))
      setProgress(Math.min(1, elapsed / done))
      if (elapsed >= done) {
        setText(target)
        setProgress(1)
        clearInterval(t)
      }
    }
    const t = setInterval(step, FRAME_MS)
    step()
    return () => clearInterval(t)
  }, [target, enabled])
  return { text, progress }
}

/** Cycles through words: each scrambles into place through a distortion that resolves as it locks. Pauses on hover. */
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
        <span key={w} className="invisible col-start-1 row-start-1 whitespace-nowrap pr-[0.12em]" aria-hidden>
          {w}
        </span>
      ))}
      <span className="relative col-start-1 row-start-1 justify-self-start whitespace-nowrap" aria-hidden>
        <AnimatePresence mode="wait" initial={false}>
          <ScrambleWord key={word} text={word} animate={!reduced} />
        </AnimatePresence>
        <Swash key={`swash-${word}`} animate={!reduced} />
      </span>
    </span>
  )
}

/** One word on a gradient fill, run through an SVG turbulence displacement that fades to zero as it settles. */
function ScrambleWord({ text, animate }: { text: string; animate: boolean }) {
  const { text: shown, progress } = useScramble(text, animate)
  const id = `distort-${text}`
  const scale = animate ? (1 - progress) * 26 : 0 // px of displacement, gone when locked
  const freq = 0.015 + (1 - progress) * 0.06
  return (
    <motion.span
      className={cn('relative inline-block bg-clip-text text-transparent [-webkit-background-clip:text] [padding-right:0.12em]', animate && 'animate-text-flow')}
      style={{
        backgroundImage: GRADIENT,
        backgroundRepeat: 'repeat-x',
        backgroundSize: `${GRADIENT_WIDTH}px 100%`,
        backgroundPositionX: 'var(--flow, 0px)',
        filter: animate && progress < 1 ? `url(#${id})` : undefined,
      }}
      initial={animate ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      exit={animate ? { opacity: 0, filter: 'blur(6px)', transition: { duration: 0.22 } } : undefined}
      transition={{ duration: 0.18 }}
    >
      {shown}
      {animate && progress < 1 && (
        <svg width="0" height="0" className="absolute" aria-hidden>
          <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={2} seed={2} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={scale} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      )}
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
