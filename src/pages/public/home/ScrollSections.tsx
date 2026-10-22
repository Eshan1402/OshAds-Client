import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring, useTransform, useVelocity, wrap, type MotionValue } from 'framer-motion'
import { ArrowRight, BadgeCheck, Search, Store } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apps } from '@/data/apps'
import { useMediaQuery, usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { useImpression } from '@/hooks/useImpression'
import { useQuery } from '@/hooks/useQuery'
import { appsService } from '@/services/appsService'
import { cn } from '@/utils/cn'
import { AppScreen, PhoneFrame } from '@/components/apps/AppScreen'
import { AppIcon } from '@/components/ui/AppIcon'
import type { MobileApp } from '@/types'
import { ButtonLink } from '@/components/ui/Button'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Magnetic } from '@/components/motion/Magnetic'
import { Eyebrow, SplitReveal } from '@/components/motion/SplitReveal'

/** Pinned scroll only where it helps: wide screens with a fine pointer and motion allowed. */
function usePinnedScroll() {
  const reduced = usePrefersReducedMotion()
  const desktop = useMediaQuery('(min-width: 1024px) and (min-height: 640px)')
  return desktop && !reduced
}

/* ─────────────────────────── Trending: apps pegged to a washing line ─────────────────────────── */

const CARD_W = 220
const SPACING = 270 // centre-to-centre distance along the rope
const SAG = 72 // how far the rope dips at the middle
const ROPE_TOP = 36

/** Rope height at x: a parabola from (0, 0) through (w/2, sag) to (w, 0). Same curve as the SVG path. */
const ropeY = (x: number, w: number, sag: number) => {
  const u = Math.min(1.2, Math.max(-0.2, x / w))
  return sag * 4 * u * (1 - u)
}
/** Card tilt at x: half the rope's tangent angle (gravity keeps hanging cards mostly upright), capped at ±15°. */
const ropeAngle = (x: number, w: number, sag: number) => {
  const deg = (Math.atan((sag * 4 * (1 - 2 * Math.min(1, Math.max(0, x / w)))) / w) * 180) / Math.PI
  return Math.max(-15, Math.min(15, deg * 0.5))
}

function HangingCard({ app, rank, slot, shift, width, loop, swing, k }: {
  app: MobileApp
  rank: number
  slot: number
  shift: MotionValue<number>
  width: number
  loop: number
  swing: MotionValue<number>
  /** Size factor: smaller cards, spacing and sag on phones. */
  k: number
}) {
  const spacing = SPACING * k
  const sag = SAG * k
  // #1 starts at the right end, later ranks hang to its left and enter as the line travels right.
  // Wrapping sends cards that leave on the right back in on the left.
  const cx = useTransform(shift, (s) => wrap(-spacing, loop - spacing, width - spacing * 0.6 - slot * spacing + s))
  const x = useTransform(cx, (c) => c - CARD_W / 2)
  const y = useTransform(cx, (c) => ROPE_TOP + ropeY(c, width, sag))
  const rotate = useTransform([cx, swing], ([c, sw]: number[]) => ropeAngle(c, width, sag) + sw)
  const host = app.website ? new URL(app.website).hostname.replace(/^www\./, '') : app.tagline
  const seen = useImpression<HTMLDivElement>(app.id)
  return (
    <motion.div ref={seen} style={{ x, y, rotate, scale: k, width: CARD_W }} className="absolute left-0 top-0 origin-top will-change-transform hover:z-20 has-[:focus-visible]:z-20">
      {/* Clip */}
      <span className="absolute -top-3 left-1/2 z-10 h-7 w-4 -translate-x-1/2 rounded-[5px] bg-accent shadow-sm" aria-hidden>
        <span className="absolute left-1/2 top-1.5 size-1.5 -translate-x-1/2 rounded-full bg-white/90" />
      </span>
      <Link
        to={`/app/${app.slug}`}
        data-cursor="View"
        className="group block origin-top rounded-[22px] border border-line bg-surface p-3 pb-4 shadow-[0_18px_40px_-18px_rgb(0_0_0/0.35)] transition-[transform,box-shadow] duration-300 ease-[var(--ease-out-expo)] hover:scale-[1.15] hover:shadow-[0_30px_60px_-18px_rgb(0_0_0/0.45)] focus-visible:scale-[1.15] focus-visible:shadow-[var(--ring)] motion-reduce:hover:scale-100"
      >
        <div className="relative grid aspect-square place-items-center overflow-hidden rounded-[16px] bg-surface-2">
          <span className="num absolute left-3 top-2 font-display text-2xl font-extrabold tracking-tight text-line-strong transition-colors duration-300 group-hover:text-accent group-focus-visible:text-accent">#{String(rank).padStart(2, '0')}</span>
          <AppIcon app={app} size="xl" className="transition-transform duration-300 group-hover:scale-105" />
        </div>
        <p className="mt-3 truncate font-display text-base font-bold text-fg">{app.name}</p>
        <p className="truncate text-xs text-subtle">{host}</p>
      </Link>
    </motion.div>
  )
}

export function PinnedTrending() {
  const pinned = usePinnedScroll()
  const reduced = usePrefersReducedMotion()
  const { data, error, refetch } = useQuery('apps:trending:12', () => appsService.trending(12))
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(1200)

  useLayoutEffect(() => {
    const el = stage.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const k = width < 640 ? 0.7 : 1
  const count = data?.length ?? 0
  // The loop is at least one screen wide plus a card, so a card is always entering as another leaves.
  const loop = Math.max(count * SPACING * k, width + 2 * SPACING * k)

  // Pinned: progress across the tall section. Not pinned: progress while the section passes the viewport.
  const { scrollYProgress } = useScroll({ target: section, offset: pinned ? ['start start', 'end end'] : ['start end', 'end start'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.5 })
  const shift = useTransform(smooth, [0, 1], reduced ? [0, 0] : [0, pinned ? loop : loop * 0.5])
  // Clothes-on-a-line swing: the faster the travel, the further cards trail behind; springs back at rest.
  const velocity = useVelocity(shift)
  const swing = useSpring(useTransform(velocity, [-2000, 0, 2000], reduced ? [0, 0, 0] : [-9, 0, 9]), { stiffness: 140, damping: 9 })

  const stageH = ROPE_TOP + (SAG + 310) * k
  return (
    <section
      ref={section}
      aria-labelledby="trend-title"
      className="relative bg-bg"
      style={pinned ? { height: '260vh' } : undefined}
    >
      <div className={cn('overflow-hidden', pinned ? 'sticky top-0 flex h-screen flex-col justify-center pt-16' : 'relative py-20 sm:py-24')}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,var(--accent-soft),transparent_70%)] opacity-70" aria-hidden />
        <div className="container-page relative flex flex-col items-center text-center">
          <Eyebrow>Trending right now</Eyebrow>
          <SplitReveal
            id="trend-title"
            className="font-display text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-fg sm:text-5xl"
            lines={['The apps everyone’s', { text: 'installing this week.', className: 'font-serif font-normal italic text-gradient-brand' }]}
          />
          <ButtonLink to="/trending" variant="outline" className="mt-5" rightIcon={<ArrowRight className="size-4" />}>
            Full ranking
          </ButtonLink>
        </div>

        <div ref={stage} className="relative mt-4 w-full" style={{ height: stageH }} data-cursor={pinned ? 'Scroll' : undefined}>
          <svg className="pointer-events-none absolute inset-x-0 top-0 h-full w-full overflow-visible" aria-hidden>
            <path d={`M 0 ${ROPE_TOP} Q ${width / 2} ${ROPE_TOP + 2 * SAG * k} ${width} ${ROPE_TOP}`} fill="none" stroke="currentColor" className="text-line-strong" strokeWidth={2} />
          </svg>
          {error ? (
            <ErrorState error={error} onRetry={refetch} className="relative" />
          ) : data ? (
            data.map((a, i) => <HangingCard key={a.id} app={a} rank={i + 1} slot={i} shift={shift} width={width} loop={loop} swing={swing} k={k} />)
          ) : (
            <div className="flex justify-center gap-6 pt-16">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[290px] w-[220px] shrink-0 rounded-[22px]" />)}</div>
          )}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── Story: pinned phone, chapters scroll past ─────────────────────────── */

const chapters = [
  {
    key: 'discover',
    icon: <Search className="size-4" />,
    kicker: 'Chapter one',
    title: 'Discover',
    accent: 'a collection, not a catalogue.',
    body: 'Small-loan apps from real lenders, a living trending chart and picks that adapt to what you care about. No infinite feed — just apps worth a look.',
    app: apps[0],
    variant: 0,
  },
  {
    key: 'understand',
    icon: <BadgeCheck className="size-4" />,
    kicker: 'Chapter two',
    title: 'Understand',
    accent: 'why it’s worth it.',
    body: 'Real store ratings, plain-language benefits and screens you can actually read — so you know what an app does before it takes up space on your phone.',
    app: apps[1],
    variant: 1,
  },
  {
    key: 'install',
    icon: <Store className="size-4" />,
    kicker: 'Chapter three',
    title: 'Install',
    accent: 'straight from the source.',
    body: 'One tap to the official App Store or Google Play listing. We never host files, never ask for store passwords, and label every sponsored campaign.',
    app: apps[2],
    variant: 0,
  },
]

export function StoryScroll() {
  const pinned = usePinnedScroll()
  const ref = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', (v) => setActive(Math.min(chapters.length - 1, Math.floor(v * chapters.length * 0.999))))
  const rotate = useTransform(scrollYProgress, [0, 1], [-8, 8])
  const ring = useTransform(scrollYProgress, [0, 1], [0, 220])
  const rail = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  if (!pinned) {
    return (
      <section className="container-page py-20 sm:py-24" aria-labelledby="story-title" id="trust">
        <Eyebrow>How it works</Eyebrow>
        <SplitReveal id="story-title" className="font-display text-4xl font-semibold tracking-[-0.04em] text-fg sm:text-5xl" lines={['Less scrolling.', { text: 'Better installs.', className: 'font-serif font-normal italic text-gradient-brand' }]} />
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {chapters.map((c, i) => (
            <motion.li key={c.key} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="rounded-[24px] glass p-6">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">{c.kicker}</span>
              <h3 className="mt-3 font-display text-2xl font-semibold text-fg">{c.title}, <span className="font-serif font-normal italic">{c.accent}</span></h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
            </motion.li>
          ))}
        </ol>
      </section>
    )
  }

  const c = chapters[active]
  return (
    <section ref={ref} id="trust" aria-labelledby="story-title" className="relative" style={{ height: `${chapters.length * 100 + 40}vh` }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="container-page grid w-full items-center gap-16 lg:grid-cols-[1fr_420px_1fr]">
          {/* Left: chapter copy */}
          <div className="relative min-h-[320px]">
            <Eyebrow>How it works</Eyebrow>
            <h2 id="story-title" className="sr-only">How OshAds works: discover, understand, install</h2>
            <AnimatePresence mode="wait">
              <motion.div
                key={c.key}
                initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -30, filter: 'blur(6px)' }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-subtle">{c.kicker}</p>
                <p className="mt-4 font-display text-6xl font-semibold leading-[0.95] tracking-[-0.045em] text-fg xl:text-7xl">{c.title}</p>
                <p className="mt-1 font-serif text-4xl italic leading-tight text-gradient-brand xl:text-5xl">{c.accent}</p>
                <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-muted">{c.body}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Center: pinned phone */}
          <div className="relative mx-auto w-[280px]">
            <motion.svg viewBox="0 0 400 400" className="absolute left-1/2 top-1/2 -z-10 size-[560px] -translate-x-1/2 -translate-y-1/2" style={{ rotate: ring }} aria-hidden>
              <defs>
                <linearGradient id="story-ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#1B3FD0" />
                  <stop offset="0.5" stopColor="#3D7BFF" />
                  <stop offset="1" stopColor="#7CC4FF" />
                </linearGradient>
              </defs>
              <circle cx="200" cy="200" r="190" fill="none" stroke="url(#story-ring)" strokeWidth="1" strokeDasharray="2 10" opacity="0.6" />
              <circle cx="200" cy="200" r="150" fill="none" stroke="var(--line)" strokeWidth="1" />
            </motion.svg>
            <div className="absolute inset-0 -z-10 scale-125 rounded-full bg-[radial-gradient(circle,rgb(123_75_234/0.18),transparent_65%)] blur-2xl" aria-hidden />
            <motion.div style={{ rotate }}>
              <PhoneFrame className="shadow-[0_50px_100px_-30px_rgb(0_0_0/0.5)]">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={c.key}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <AppScreen app={c.app} variant={c.variant} />
                  </motion.div>
                </AnimatePresence>
              </PhoneFrame>
            </motion.div>
          </div>

          {/* Right: chapter rail */}
          <div className="flex items-center justify-end gap-6">
            <ol className="space-y-5">
              {chapters.map((ch, i) => (
                <li key={ch.key} className={cn('flex items-center gap-3 transition-all duration-500', i === active ? 'text-fg' : 'text-subtle opacity-60')}>
                  <span className={cn('grid size-9 place-items-center rounded-full border transition-all duration-500', i === active ? 'border-transparent bg-[linear-gradient(135deg,#1B3FD0,#3D7BFF)] text-white shadow-lg' : 'border-line')}>
                    {ch.icon}
                  </span>
                  <span className="font-display text-lg font-semibold">{ch.title}</span>
                </li>
              ))}
            </ol>
            <div className="h-48 w-px overflow-hidden bg-line" aria-hidden>
              <motion.div style={{ scaleY: rail }} className="h-full w-full origin-top bg-[linear-gradient(180deg,#1B3FD0,#3D7BFF,#7CC4FF)]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── Publisher CTA: expands as it enters ─────────────────────────── */

export function ExpandingCTA() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 35%'] })
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1])
  const radius = useTransform(scrollYProgress, [0, 1], [64, 32])
  const y = useTransform(scrollYProgress, [0, 1], [60, 0])
  return (
    <section className="px-4 pb-24 sm:px-6" aria-labelledby="pub-title">
      <motion.div
        ref={ref}
        style={reduced ? undefined : { scale, borderRadius: radius, y }}
        className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[32px] bg-ink-950 px-6 py-16 text-white ring-1 ring-white/10 sm:px-14 sm:py-24"
      >
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.07] [filter:invert(1)]" aria-hidden />
        <div className="pointer-events-none absolute -right-40 -top-56 size-[640px] rounded-full bg-[radial-gradient(circle,rgb(123_75_234/0.4),transparent_60%)] blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-60 left-10 size-[560px] rounded-full bg-[radial-gradient(circle,rgb(242_86_104/0.28),transparent_60%)] blur-2xl" aria-hidden />
        <div className="relative grid items-end gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <Eyebrow className="!text-white/50">For app publishers</Eyebrow>
            <SplitReveal
              id="pub-title"
              className="font-display text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl"
              lines={['Reach people who', { text: 'actually want your app.', className: 'font-serif font-normal italic text-gradient-brand' }]}
            />
            <p className="mt-6 max-w-lg text-white/65">
              First-party discovery campaigns with transparent reporting, fraud-filtered installs and dashboards that update in real time.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Magnetic>
              <ButtonLink to="/about#advertisers" size="lg" variant="inverse" className="group/cta rounded-full px-6" rightIcon={<ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-0.5" />}>
                Run a campaign
              </ButtonLink>
            </Magnetic>
            <ButtonLink to="/login" size="lg" variant="ghost" className="rounded-full text-white/80 hover:bg-white/10 hover:text-white">
              Partner login
            </ButtonLink>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
