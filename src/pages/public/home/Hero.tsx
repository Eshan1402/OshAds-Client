import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Coins, Gift, ShieldCheck, Sparkles, Store } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { InteractiveHeadline } from '@/components/motion/InteractiveHeadline'
import { Magnetic } from '@/components/motion/Magnetic'
import { RotatingWord } from '@/components/motion/RotatingWord'
import { apps, REWARD_COINS } from '@/data/apps'
import { categories, categoryBySlug } from '@/data/categories'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { useQuery } from '@/hooks/useQuery'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { appsService } from '@/services/appsService'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { AppIcon } from '@/components/ui/AppIcon'
import { ButtonLink } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Feedback'
import type { CategorySlug } from '@/types'

const rewardCount = apps.filter((a) => a.reward && a.status === 'live').length
const liveCount = apps.filter((a) => a.status === 'live').length
// Only figures the catalogue can back up.
const stats = [
  { value: liveCount, suffix: '', label: 'Listed apps' },
  { value: categories.length, suffix: '', label: 'Categories' },
  { value: rewardCount, suffix: '', label: 'Install rewards live' },
  { value: REWARD_COINS, suffix: '', label: 'Osh coins per install' },
]

export function Hero() {
  const reduced = usePrefersReducedMotion()
  const ease = [0.16, 1, 0.3, 1] as const
  const section = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end start'] })
  const textY = useTransform(scrollYProgress, [0, 1], [0, -140])
  const textOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0])
  const statsY = useTransform(scrollYProgress, [0, 1], [0, -40])

  return (
    <section ref={section} className="relative overflow-hidden" aria-labelledby="hero-title">
      {/* Atmosphere — drawn from the logo's violet, coral and amber */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 grid-bg opacity-70 [mask-image:radial-gradient(65%_55%_at_65%_30%,black,transparent)]" />
        <div className="absolute -top-48 right-[-8%] size-[620px] rounded-full bg-[radial-gradient(circle,rgb(123_75_234/0.20),transparent_65%)] blur-2xl" />
        <div className="absolute right-[18%] top-[30%] size-[460px] rounded-full bg-[radial-gradient(circle,rgb(242_86_104/0.16),transparent_65%)] blur-2xl" />
        <div className="absolute -left-48 top-24 size-[520px] rounded-full bg-[radial-gradient(circle,rgb(246_164_67/0.10),transparent_65%)] blur-2xl" />
        <Particles />
      </div>

      <div className="container-page relative mx-auto grid max-w-[1180px] items-center gap-12 pb-16 pt-16 sm:pt-24 lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-28 xl:gap-20">
        <motion.div style={reduced ? undefined : { y: textY, opacity: textOpacity }} className="relative z-10 flex min-w-0 flex-col items-start text-left">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-subtle"
          >
            <span className="hidden h-px w-8 bg-gradient-to-r from-[#1B3FD0] to-[#3D7BFF] sm:block" aria-hidden />
            The OshAds edit · Curated app discovery
          </motion.p>

          <InteractiveHeadline
            label="Apps worth your attention."
            words={['Apps', 'worth']}
            className="mt-7 font-display text-[46px] font-semibold leading-[1.02] tracking-[-0.045em] text-fg sm:text-[72px] lg:text-[76px] xl:text-[88px]"
            accent={
              <span className="font-serif text-[1.12em] font-normal italic leading-[1.05] tracking-[-0.02em]">
                <span className="text-gradient-brand">your&nbsp;</span>
                <RotatingWord words={['attention.', 'time.', 'curiosity.', 'thumbs.']} />
              </span>
            }
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.14, ease }}
            className="mt-8 max-w-[36rem] text-[17px] leading-[1.65] text-muted sm:text-lg"
          >
            Skip the endless store scroll. Every app here is <span className="text-fg">reviewed by people</span>, explained in plain words, and some come with{' '}
            <span className="text-fg">rewards you can’t get anywhere else</span>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.22, ease }}
            className="mt-10 flex flex-col items-start"
          >
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Magnetic>
                <ButtonLink to="/explore" size="lg" variant="secondary" className="group/cta rounded-full px-6 shadow-lg" rightIcon={<ArrowRight className="size-4 transition-transform duration-300 group-hover/cta:translate-x-0.5" />}>
                  Find your next app
                </ButtonLink>
              </Magnetic>
              <a
                href="/rewards"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('perks')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="group/reward inline-flex h-12 items-center gap-2.5 rounded-full glass pl-1.5 pr-4 text-sm font-medium text-fg backdrop-blur transition hover:border-line-strong"
              >
                <span className="relative grid size-9 place-items-center rounded-full bg-[linear-gradient(135deg,#1B3FD0,#3D7BFF,#7CC4FF)] text-white">
                  <Gift className="size-4" aria-hidden />
                  <span className="absolute -right-0.5 -top-0.5 size-2.5 animate-pulse-dot rounded-full bg-[#7CC4FF] text-[#7CC4FF] ring-2 ring-bg" aria-hidden />
                </span>
                {`${rewardCount} install rewards live`}
                <ArrowRight className="size-3.5 text-subtle transition-transform group-hover/reward:translate-x-0.5" aria-hidden />
              </a>
            </div>
            <p className="mt-3 text-xs text-subtle">Free to browse · No sign-up · Opens the official store</p>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-6 text-[13px] text-subtle"
            aria-label="Why people trust OshAds"
          >
            <li className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-fg/70" aria-hidden /> Hand-reviewed listings</li>
            <li className="inline-flex items-center gap-2"><Store className="size-4 text-fg/70" aria-hidden /> Official websites and stores only</li>
          </motion.ul>
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease }}
          className="relative z-10 min-w-0"
        >
          <SuggestedApps />
        </motion.div>
      </div>

      <motion.div style={reduced ? undefined : { y: statsY }} className="container-page relative mx-auto max-w-[1180px] pb-16">
        <dl className="grid grid-cols-2 gap-y-8 border-y border-line py-8 sm:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className={`px-1 text-center sm:px-6 ${i ? 'sm:border-l sm:border-line' : ''}`}>
              <dd className="num font-serif text-[44px] leading-none tracking-[-0.02em] text-fg sm:text-[52px]">
                <AnimatedCounter value={s.value} format={(n) => Math.round(n).toString() + s.suffix} />
              </dd>
              <dt className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">{s.label}</dt>
            </div>
          ))}
        </dl>
      </motion.div>
    </section>
  )
}

const ROTATE_MS = 4500

/** One suggestion at a time from the recommendation engine, tuned by the visitor's interests and recent views. */
function SuggestedApps() {
  const reduced = usePrefersReducedMotion()
  const [interests] = useLocalStorage<CategorySlug[]>('adwin:interests', ['loans'])
  const { ids: viewed } = useRecentlyViewed()
  const key = `apps:recommended:hero:${[...interests].sort().join(',')}:${viewed.slice(0, 4).join(',')}`
  const { data } = useQuery(key, () => appsService.recommended(interests, 6, viewed), { keepPrevious: true })
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  // Advance only once the current app has finished appearing, so a throttled tab never shows an empty card.
  const settled = useRef(true)
  const count = data?.length ?? 0

  useEffect(() => {
    if (reduced || paused || count < 2) return
    const t = setInterval(() => {
      if (document.hidden || !settled.current) return
      settled.current = false
      setIndex((i) => (i + 1) % count)
    }, ROTATE_MS)
    return () => clearInterval(t)
  }, [reduced, paused, count])

  const app = data?.[index % Math.max(count, 1)]
  return (
    <div
      className="relative mx-auto w-full max-w-[520px] lg:max-w-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="rounded-[28px] glass p-5 shadow-[0_40px_90px_-48px_rgb(27_63_208/0.5)] sm:p-6">
        <div className="flex items-center justify-between">
          <p className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            <Sparkles className="size-3.5 text-accent-text" aria-hidden /> Suggested for you
          </p>
          {count > 1 && <span className="num text-xs text-subtle">{(index % count) + 1} / {count}</span>}
        </div>

        <div className="relative mt-5 min-h-[300px]" aria-live="polite">
          {!app ? (
            <Skeleton className="h-[300px] rounded-[20px]" />
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={app.id}
                initial={reduced ? false : { opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduced ? undefined : { opacity: 0, x: -24 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                onAnimationComplete={() => (settled.current = true)}
              >
                <Link to={`/app/${app.slug}`} className="group block rounded-[20px] bg-surface p-5 ring-1 ring-line transition hover:ring-line-strong focus-visible:ring-accent">
                  <div className="grid aspect-[16/10] place-items-center rounded-2xl bg-surface-2">
                    <AppIcon app={app} size="xl" className="shadow-md transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-semibold text-fg">{app.name}</p>
                      <p className="truncate text-xs text-subtle">
                        {categoryBySlug[app.category]?.name}
                        {app.website && ` · ${new URL(app.website).hostname.replace(/^www\./, '')}`}
                      </p>
                    </div>
                    {app.reward && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-accent-soft px-2 py-1 text-xs font-semibold text-accent-text">
                        <Coins className="size-3.5" aria-hidden /> {REWARD_COINS}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted">
                    {app.reason}
                    {app.sponsored && <span className="text-subtle"> · Sponsored</span>}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-accent-text">
                    View app <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {count > 1 && (
          <div className="mt-5 flex gap-1.5" role="group" aria-label="Choose a suggestion">
            {data!.map((a, i) => {
              const active = i === index % count
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    settled.current = true
                    setIndex(i)
                  }}
                  aria-label={`Show ${a.name}`}
                  aria-current={active}
                  className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-line transition hover:bg-line-strong"
                >
                  {active && (
                    <motion.span
                      key={`${a.id}-${paused}`}
                      className="absolute inset-y-0 left-0 rounded-full bg-accent"
                      initial={{ width: reduced || paused ? '100%' : '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: reduced || paused ? 0 : ROTATE_MS / 1000, ease: 'linear' }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/** Sparse drifting particles drawn on a single canvas; paused when reduced motion is on. */
function Particles() {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduced = usePrefersReducedMotion()
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || reduced) return
    const ctx = canvas.getContext('2d')!
    let raf = 0
    const dpr = Math.min(2, window.devicePixelRatio)
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
    }
    resize()
    const pts = Array.from({ length: 36 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.4 + 0.4,
      vx: (Math.random() - 0.5) * 0.00012,
      vy: -Math.random() * 0.00018 - 0.00004,
      a: Math.random() * 0.45 + 0.15,
      c: ['rgba(27,63,208,A)', 'rgba(61,123,255,A)', 'rgba(124,196,255,A)'][Math.floor(Math.random() * 3)],
    }))
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of pts) {
        p.x += p.vx
        p.y += p.vy
        if (p.y < -0.02) p.y = 1.02
        if (p.x < 0) p.x = 1
        if (p.x > 1) p.x = 0
        ctx.beginPath()
        ctx.fillStyle = p.c.replace('A', String(p.a))
        ctx.arc(p.x * canvas.width, p.y * canvas.height, p.r * dpr, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [reduced])
  return <canvas ref={ref} className="absolute inset-0 h-full w-full opacity-60" />
}
