import { motion } from 'framer-motion'
import { ArrowUpRight, BadgeCheck, Gift, ShieldCheck, Timer, UserX } from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import { useStaggerReveal } from '@/hooks/useStaggerReveal'
import { Link } from 'react-router-dom'
import { useQuery } from '@/hooks/useQuery'
import { appsService } from '@/services/appsService'
import { cn } from '@/utils/cn'
import { formatDownloads } from '@/utils/format'
import { AppIcon } from '@/components/ui/AppIcon'
import { Skeleton } from '@/components/ui/Feedback'
import { Eyebrow, SplitReveal } from '@/components/motion/SplitReveal'
import { spotlightClass, trackSpotlight } from '@/components/motion/Spotlight'

const ease = [0.16, 1, 0.3, 1] as const

/** "What's in it for me?" — answers the visitor's question before they have to ask it. */
export function PerksSection() {
  const { data } = useQuery('apps:list:all', () => appsService.list())
  const rewards = data?.filter((a) => a.reward) ?? []
  const bento = useRef<HTMLDivElement>(null)
  useStaggerReveal(bento)

  return (
    <section id="perks" className="container-page scroll-mt-24 py-20 sm:py-28" aria-labelledby="perks-title">
      <div className="mb-12 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <Eyebrow>What you get</Eyebrow>
          <SplitReveal
            id="perks-title"
            className="font-display text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-fg sm:text-[56px]"
            lines={['Why it’s worth', { text: 'your click.', className: 'font-serif font-normal italic tracking-[-0.02em] text-gradient-brand' }]}
          />
        </div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2, ease }}
          className="max-w-sm text-[15px] leading-relaxed text-muted"
        >
          Browsing is free and needs no account. You get perks you won’t find in the store — and you skip the apps that waste your time.
        </motion.p>
      </div>

      <div ref={bento} className="grid gap-4 lg:grid-cols-12 lg:grid-rows-2">
        {/* Rewards — the concrete, immediate benefit */}
        <Tile className="lg:col-span-6 lg:row-span-2" delay={0} tone="feature">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/90">
                <span className="size-1.5 animate-pulse-dot rounded-full bg-[#7CC4FF] text-[#7CC4FF]" /> Live this week
              </span>
              <h3 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-4xl">
                Earn 20 Osh coins,
                <br />
                <span className="font-serif font-normal italic">on every app you install.</span>
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/75">
                Install any app through OshAds and 20 coins land in your wallet once the install is confirmed. No sign-up needed.
              </p>
            </div>
            <motion.span
              className="hidden size-14 shrink-0 place-items-center rounded-2xl bg-white/15 text-white sm:grid"
              animate={{ rotate: [0, -8, 8, 0], y: [0, -4, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
              aria-hidden
            >
              <Gift className="size-6" />
            </motion.span>
          </div>

          <ul className="mt-7 space-y-2">
            {data
              ? rewards.slice(0, 5).map((a, i) => (
                  <motion.li
                    key={a.id}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.25 + i * 0.08, duration: 0.5, ease }}
                  >
                    <Link
                      to={`/app/${a.slug}`}
                      data-cursor="Earn"
                      className="group/row flex items-center gap-3 rounded-2xl bg-white/10 p-2.5 pr-3 ring-1 ring-white/10 backdrop-blur transition-all duration-300 hover:bg-white/20 hover:ring-white/30"
                    >
                      <AppIcon app={a} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">{a.reward}</span>
                        <span className="block truncate text-xs text-white/65">{[a.name, a.rating > 0 && `★ ${a.rating.toFixed(1)}`, a.downloads > 0 && formatDownloads(a.downloads)].filter(Boolean).join(' · ')}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink-950 transition-transform duration-300 group-hover/row:scale-105">
                        Earn <ArrowUpRight className="size-3" />
                      </span>
                    </Link>
                  </motion.li>
                ))
              : Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-2xl !bg-white/10" />)}
          </ul>
          <Link to="/rewards" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-white hover:underline">
            Open your wallet <ArrowUpRight className="size-3.5" />
          </Link>
          <p className="mt-2 text-[11px] text-white/55">One reward per app. Coins are saved in this browser; coupons to spend them on are coming soon.</p>
        </Tile>

        <Benefit
          className="lg:col-span-3"
          delay={0.08}
          icon={<BadgeCheck />}
          title="Every app vetted"
          body="Our team checks quality, privacy practices and honest marketing before anything is listed."
          motif={<CheckMotif />}
        />
        <Benefit
          className="lg:col-span-3"
          delay={0.14}
          icon={<Timer />}
          title="Decide in a minute"
          body="Benefits in plain words, real store ratings and screens you can read — before you install."
          motif={<ClockMotif />}
        />
        <Benefit
          className="lg:col-span-3"
          delay={0.2}
          icon={<ShieldCheck />}
          title="Official sources only"
          body="Links open the lender’s own website or store listing. We never host files or ask for passwords."
          motif={<ShieldMotif />}
        />
        <Benefit
          className="lg:col-span-3"
          delay={0.26}
          icon={<UserX />}
          title="Free, no account"
          body="Browse, compare and get personal picks without signing up. Preferences stay on your device."
          motif={<SparkMotif />}
        />
      </div>
    </section>
  )
}

function Tile({ children, className, delay, tone }: { children: ReactNode; className?: string; delay: number; tone?: 'feature' }) {
  return (
    <div
      data-reveal
      data-delay={delay}
      onPointerMove={trackSpotlight}
      className={cn(
        'group/card relative overflow-hidden rounded-[28px] p-6 sm:p-8',
        tone === 'feature'
          ? 'bg-[linear-gradient(150deg,#142FA8_0%,#1F49D8_45%,#2F6BFF_80%,#6FB6FF_120%)] shadow-xl'
          : 'glass transition-[border-color,box-shadow] duration-300 hover:border-line-strong hover:shadow-lg',
        className,
      )}
    >
      {tone === 'feature' && (
        <>
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.12] [filter:invert(1)] [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
          <motion.div
            className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/20 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
          />
        </>
      )}
      {tone !== 'feature' && <span className={spotlightClass} aria-hidden />}
      <div className="relative">{children}</div>
    </div>
  )
}

function Benefit({ icon, title, body, motif, className, delay }: { icon: ReactNode; title: string; body: string; motif: ReactNode; className?: string; delay: number }) {
  return (
    <Tile className={cn('flex min-h-[220px] flex-col', className)} delay={delay}>
      <div className="flex items-start justify-between">
        <span className="grid size-11 place-items-center rounded-xl bg-[linear-gradient(140deg,rgb(123_75_234/0.14),rgb(242_86_104/0.14))] text-[#1B3FD0] transition-transform duration-500 ease-[var(--ease-spring)] group-hover/card:-rotate-6 group-hover/card:scale-110 dark:text-[#A9C4FF] [&>svg]:size-5">
          {icon}
        </span>
        <span className="size-16 text-line-strong transition-colors duration-500 group-hover/card:text-[#3D7BFF]" aria-hidden>
          {motif}
        </span>
      </div>
      <h3 className="mt-6 font-display text-lg font-semibold tracking-[-0.01em] text-fg">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
    </Tile>
  )
}

/* Small line-art motifs that draw themselves when the tile scrolls into view. */
const draw = {
  initial: { pathLength: 0 },
  whileInView: { pathLength: 1 },
  viewport: { once: true },
  transition: { duration: 1.4, ease: [0.65, 0, 0.35, 1] as const, delay: 0.3 },
}

function CheckMotif() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <motion.circle cx="32" cy="32" r="26" {...draw} />
      <motion.path d="M21 33 l7 7 l15 -16" {...draw} transition={{ ...draw.transition, delay: 0.9 }} />
    </svg>
  )
}
function ClockMotif() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <motion.circle cx="32" cy="34" r="24" {...draw} />
      <motion.path d="M32 34 V20" animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '32px 34px', transformBox: 'view-box' }} />
      <path d="M32 34 L42 40" />
      <path d="M27 6 h10" />
    </svg>
  )
}
function ShieldMotif() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <motion.path d="M32 6 L54 14 V30 C54 44 44 54 32 58 C20 54 10 44 10 30 V14 Z" {...draw} />
      <motion.path d="M32 18 V44 M20 31 H44" strokeLinecap="round" {...draw} transition={{ ...draw.transition, delay: 0.9 }} />
    </svg>
  )
}
function SparkMotif() {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor">
      {[
        [32, 32, 1],
        [14, 16, 0.45],
        [50, 48, 0.55],
      ].map(([x, y, s], i) => (
        <motion.path
          key={i}
          d="M0 -14 C1 -4 4 -1 14 0 C4 1 1 4 0 14 C-1 4 -4 1 -14 0 C-4 -1 -1 -4 0 -14 Z"
          transform={`translate(${x} ${y}) scale(${s})`}
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6, ease: 'easeInOut' }}
        />
      ))}
    </svg>
  )
}
