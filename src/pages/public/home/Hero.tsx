import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Coins, Compass, Gamepad2, Search, ShieldCheck, Store, UserRoundX } from 'lucide-react'
import { useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RotatingWord } from '@/components/motion/RotatingWord'
import { apps, REWARD_COINS } from '@/data/apps'
import { categories } from '@/data/categories'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { LogoMark } from '@/components/ui/Logo'
import { cn } from '@/utils/cn'

const live = apps.filter((a) => a.status === 'live')
const rewardCount = live.filter((a) => a.reward).length
const withLogo = live.filter((a) => a.iconImage)
// Two rings of real listings circling the logo: radius (% of the stage), seconds per lap, which apps.
const RINGS = [
  { r: 27, lap: 44, apps: withLogo.slice(0, 4) },
  { r: 46, lap: 70, apps: withLogo.slice(4, 11) },
]
const ease = [0.16, 1, 0.3, 1] as const
const toGames = (e: MouseEvent) => {
  e.preventDefault()
  document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })
}

export function Hero() {
  const reduced = usePrefersReducedMotion()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  // Leaving the hero: the words lift and fade while the orbit grows and turns, so the scroll feels like flying past it.
  const section = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end start'] })
  const textY = useTransform(scrollYProgress, [0, 1], [0, -110])
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const orbitScale = useTransform(scrollYProgress, [0, 1], [1, 1.25])
  const orbitTurn = useTransform(scrollYProgress, [0, 1], [0, 50])
  const rise = (delay: number) => ({
    initial: reduced ? false : ({ opacity: 0, y: 18, filter: 'blur(10px)' } as const),
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { duration: 0.8, delay, ease },
  })
  // Headline lines slide up from behind a mask, one after another; the little picture pops in after its words.
  const line = (i: number, words: ReactNode, picture: ReactNode) => (
    <span className="-mb-[0.14em] block overflow-hidden pb-[0.14em] pt-[0.06em]">
      <motion.span className="flex items-center gap-[0.24em] whitespace-nowrap" initial={reduced ? false : { y: '115%' }} animate={{ y: 0 }} transition={{ duration: 1, delay: 0.1 + i * 0.11, ease }}>
        {words}
        <motion.span className="shrink-0" initial={reduced ? false : { scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.75 + i * 0.12 }}>
          {picture}
        </motion.span>
      </motion.span>
    </span>
  )

  return (
    <section ref={section} className="relative overflow-hidden" aria-labelledby="hero-title">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 grid-bg opacity-60 [mask-image:radial-gradient(70%_60%_at_60%_35%,black,transparent)]" />
        <div className="absolute -left-40 -top-40 size-[560px] animate-float rounded-full bg-[radial-gradient(circle,rgb(47_107_255/0.20),transparent_65%)] blur-2xl [animation-duration:16s]" />
        <div className="absolute right-[-10%] top-[8%] size-[680px] animate-float rounded-full bg-[radial-gradient(circle,rgb(27_63_208/0.26),transparent_62%)] blur-2xl [animation-delay:-6s] [animation-duration:20s]" />
        <div className="absolute bottom-[-30%] left-[30%] size-[520px] rounded-full bg-[radial-gradient(circle,rgb(124_196_255/0.10),transparent_65%)] blur-2xl" />
      </div>

      <div className="container-page relative mx-auto grid max-w-[1200px] items-center gap-10 pb-10 pt-12 sm:pt-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-6 lg:pb-14 lg:pt-20">
        <motion.div style={reduced ? undefined : { y: textY, opacity: textOpacity }} className="relative z-10 min-w-0">
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, ease }}
            className="mb-5 inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted"
          >
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent/60" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            Driven by results · App discovery &amp; install campaigns
          </motion.p>
          <h1 id="hero-title" aria-label="Discover apps. Play games. Earn rewards." className="font-hero text-[36px] font-bold leading-[1.04] tracking-[-0.045em] text-fg sm:text-[64px] lg:text-[60px] xl:text-[70px]">
            <span aria-hidden>
              {line(
                0,
                'Discover apps.',
                <span className="flex -space-x-[0.2em]">
                  {withLogo.slice(11, 14).map((a, i) => (
                    <img key={a.id} src={a.iconImage} alt="" className="size-[0.74em] rounded-[0.2em] bg-white object-cover shadow-lg ring-[0.04em] ring-bg" style={{ rotate: `${(i - 1) * 7}deg` }} />
                  ))}
                </span>,
              )}
              {line(
                1,
                'Play games.',
                <span className="grid size-[0.78em] rotate-6 place-items-center rounded-[0.22em] bg-[linear-gradient(135deg,#7C3AED,#2F6BFF)] text-white shadow-[0_0.12em_0.4em_-0.08em_rgb(124_58_237/0.8)]">
                  <Gamepad2 className="size-[0.5em]" strokeWidth={2.2} />
                </span>,
              )}
              {line(
                2,
                <span>
                  Earn{' '}
                  <span className="font-accent text-[1.12em] font-normal italic tracking-[-0.02em]">
                    <RotatingWord words={['rewards.', 'coins.', 'perks.']} />
                  </span>
                </span>,
                <span className="grid size-[0.72em] animate-float place-items-center rounded-full bg-[linear-gradient(145deg,#FDE68A,#F59E0B_55%,#B45309)] text-[#78350F] shadow-[0_0.12em_0.4em_-0.08em_rgb(245_158_11/0.9),inset_0_0.03em_0_rgb(255_255_255/0.7)] [animation-duration:5s]">
                  <Coins className="size-[0.42em]" strokeWidth={2.4} />
                </span>,
              )}
            </span>
          </h1>

          <motion.p {...rise(0.45)} className="mt-6 max-w-[34rem] text-base leading-[1.65] text-muted sm:text-lg">
            OshAds is a free guide to apps. We explain each one <span className="text-fg">in plain words</span>, send you to its <span className="text-fg">official store</span>, and give you{' '}
            <span className="text-fg">{REWARD_COINS} Osh coins</span> for installing the ones marked with a reward.
          </motion.p>

          <motion.form
            {...rise(0.55)}
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              navigate(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/search')
            }}
            className="mt-8 flex h-14 w-full max-w-[520px] items-center gap-2 rounded-full glass-strong pl-5 pr-1.5 shadow-[0_24px_60px_-28px_rgb(47_107_255/0.8)] transition focus-within:ring-2 focus-within:ring-accent"
          >
            <Search className="size-5 shrink-0 text-subtle" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search apps, e.g. loans"
              aria-label="Search apps"
              className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-subtle [&::-webkit-search-cancel-button]:hidden"
            />
            <button type="submit" className="group/go inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-hover active:scale-[0.97]">
              Search <ArrowRight className="size-4 transition-transform group-hover/go:translate-x-0.5" aria-hidden />
            </button>
          </motion.form>

          <motion.ul {...rise(0.62)} className="-mx-1 mt-4 flex max-w-full gap-2 overflow-x-auto px-1 pb-1 scrollbar-none sm:flex-wrap" aria-label="Popular categories">
            {categories.slice(0, 6).map((c) => (
              <li key={c.slug} className="shrink-0">
                <Link to={`/categories/${c.slug}`} className="inline-flex h-9 items-center gap-2 rounded-full glass px-3.5 text-[13px] text-muted transition hover:-translate-y-0.5 hover:border-line-strong hover:text-fg">
                  <span className="size-2 rounded-full" style={{ background: c.colors[0] }} aria-hidden />
                  {c.name}
                </Link>
              </li>
            ))}
          </motion.ul>

          <motion.ul {...rise(0.7)} className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-subtle" aria-label="Why people trust OshAds">
            <li className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-fg/70" aria-hidden /> Hand-reviewed listings</li>
            <li className="inline-flex items-center gap-1.5"><Store className="size-4 text-fg/70" aria-hidden /> Official stores only</li>
            <li className="inline-flex items-center gap-1.5"><UserRoundX className="size-4 text-fg/70" aria-hidden /> No account needed</li>
          </motion.ul>
        </motion.div>

        <motion.div style={reduced ? undefined : { scale: orbitScale, rotate: orbitTurn }}>
          <Orbit reduced={reduced} />
        </motion.div>
      </div>

      {/* The three things to do here, as one bar of doors. */}
      <motion.div {...rise(0.8)} className="container-page relative mx-auto max-w-[1200px] pb-16">
        <div className="grid overflow-hidden rounded-[28px] glass max-sm:divide-y max-sm:divide-line sm:grid-cols-3 sm:divide-x sm:divide-line">
          <Door to="/explore" icon={<Compass />} value={live.length} unit="apps to discover" cta="Browse apps" />
          <Door to="/#games" onClick={toGames} icon={<Gamepad2 />} value={7} unit="free games to play" cta="Play now" />
          <Door to="/rewards" icon={<Coins />} value={REWARD_COINS} unit="coins per install" cta={`${rewardCount} reward apps`} />
        </div>
      </motion.div>
    </section>
  )
}

/** Real app logos circling the OshAds mark. Hovering stops the rings so a logo can be clicked. */
function Orbit({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.86 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, delay: 0.25, ease }}
      className="group/orbit relative mx-auto aspect-square w-full max-w-[340px] sm:max-w-[440px] lg:max-w-[500px]"
    >
      <div className="absolute inset-[14%] rounded-full bg-[radial-gradient(circle,rgb(47_107_255/0.35),transparent_68%)] blur-2xl" aria-hidden />
      {RINGS.map((ring) => (
        <div key={ring.r} className="absolute rounded-full border border-fg/10" style={{ inset: `${50 - ring.r}%` }} aria-hidden />
      ))}
      <div className="absolute inset-0 rounded-full border border-dashed border-fg/10" aria-hidden />

      <div className="absolute left-1/2 top-1/2 grid size-[24%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full glass-strong shadow-[0_0_60px_-6px_rgb(47_107_255/0.75)]">
        <span className="absolute inset-0 animate-pulse-dot rounded-full text-accent" aria-hidden />
        <LogoMark className="size-[54%]" />
      </div>

      {RINGS.map((ring, k) => (
        <div
          key={ring.r}
          className="absolute inset-0 animate-orbit group-hover/orbit:[animation-play-state:paused]"
          style={{ animationDuration: `${ring.lap}s`, animationDirection: k % 2 ? 'reverse' : 'normal' }}
        >
          {ring.apps.map((app, i) => {
            const a = (i / ring.apps.length) * Math.PI * 2 + k
            return (
              <div key={app.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${50 + ring.r * Math.cos(a)}%`, top: `${50 + ring.r * Math.sin(a)}%` }}>
                {/* Turns the other way at the same pace, so the logo stays upright. */}
                <div className="animate-orbit group-hover/orbit:[animation-play-state:paused]" style={{ animationDuration: `${ring.lap}s`, animationDirection: k % 2 ? 'normal' : 'reverse' }}>
                  <Link to={`/app/${app.slug}`} aria-label={app.name} title={app.name} className="block transition-transform duration-300 hover:scale-125">
                    <img
                      src={app.iconImage}
                      alt=""
                      className={cn('max-w-none rounded-[26%] bg-white object-cover shadow-[0_14px_30px_-12px_rgb(0_0_0/0.6)] ring-1 ring-white/15', k ? 'size-10 sm:size-12 lg:size-[54px]' : 'size-9 sm:size-11 lg:size-12')}
                    />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ))}

      <a href="/#games" onClick={toGames} className="absolute left-0 top-[9%] z-10 inline-flex animate-float items-center gap-2 rounded-2xl glass-strong py-2 pl-2 pr-3.5 text-[13px] font-semibold text-fg shadow-lg transition hover:border-line-strong [animation-duration:6s]">
        <span className="grid size-8 place-items-center rounded-xl bg-[linear-gradient(135deg,#7C3AED,#2F6BFF)] text-white"><Gamepad2 className="size-4" aria-hidden /></span>
        7 free games
      </a>
      <Link to="/rewards" className="absolute bottom-[9%] right-0 z-10 inline-flex animate-float items-center gap-2 rounded-2xl glass-strong py-2 pl-2 pr-3.5 text-[13px] font-semibold text-fg shadow-lg transition hover:border-line-strong [animation-delay:-3s] [animation-duration:7s]">
        <span className="grid size-8 place-items-center rounded-xl bg-[linear-gradient(145deg,#FDE68A,#F59E0B)] text-[#78350F]"><Coins className="size-4" aria-hidden /></span>
        +{REWARD_COINS} coins per install
      </Link>
    </motion.div>
  )
}

function Door({ to, onClick, icon, value, unit, cta }: { to: string; onClick?: (e: MouseEvent) => void; icon: ReactNode; value: number; unit: string; cta: string }) {
  return (
    <Link to={to} onClick={onClick} className="group relative flex items-center gap-4 p-5 transition-colors duration-300 hover:bg-fg/[0.04] sm:p-6">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#1B3FD0,#3D7BFF,#7CC4FF)] text-white shadow-[0_10px_24px_-10px_rgb(47_107_255/0.9)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 [&>svg]:size-5">{icon}</span>
      <span className="min-w-0">
        <span className="flex items-baseline gap-2">
          <span className="num font-display text-[34px] font-bold leading-none tracking-[-0.03em] text-fg">
            <AnimatedCounter value={value} format={(n) => Math.round(n).toString()} />
          </span>
          <span className="truncate text-sm font-medium text-fg">{unit}</span>
        </span>
        <span className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-semibold text-accent-text">
          {cta} <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
        </span>
      </span>
    </Link>
  )
}
