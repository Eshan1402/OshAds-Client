import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useImpression } from '@/hooks/useImpression'
import { ArrowUpRight, Download, Gift } from 'lucide-react'
import { memo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { categoryBySlug } from '@/data/categories'
import { usePrefersReducedMotion, useMediaQuery } from '@/hooks/useMediaQuery'
import type { MobileApp, Platform } from '@/types'
import { cn } from '@/utils/cn'
import { formatDownloads } from '@/utils/format'
import { AppIcon } from '@/components/ui/AppIcon'
import { RatingPill } from '@/components/ui/Rating'
import { Skeleton } from '@/components/ui/Feedback'
import { spotlightClass, trackSpotlight } from '@/components/motion/Spotlight'

export function PlatformChips({ platforms, className }: { platforms: Platform[]; className?: string }) {
  return (
    <span className={cn('flex gap-1', className)}>
      {platforms.map((p) => (
        <span key={p} className="rounded-md bg-black/35 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
          {p === 'ios' ? 'iOS' : 'Android'}
        </span>
      ))}
    </span>
  )
}

export function CampaignBadgeChip({ app, className }: { app: MobileApp; className?: string }) {
  if (!app.badge) return null
  const reward = app.badge === 'Reward'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm',
        reward ? 'bg-gold-500 text-ink-950' : 'bg-white text-ink-900',
        className,
      )}
    >
      {reward && <Gift className="size-3" aria-hidden />}
      {app.badge}
    </span>
  )
}

/** Hook: subtle pointer-driven 3D tilt. Disabled for touch and reduced motion. */
function useTilt(max = 6) {
  const reduced = usePrefersReducedMotion()
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)')
  const enabled = !reduced && fine
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)
  const rx = useSpring(useTransform(y, [0, 1], [max, -max]), { stiffness: 220, damping: 22 })
  const ry = useSpring(useTransform(x, [0, 1], [-max, max]), { stiffness: 220, damping: 22 })
  return {
    style: enabled ? { rotateX: rx, rotateY: ry, transformPerspective: 900 } : undefined,
    onPointerMove: enabled
      ? (e: React.PointerEvent<HTMLElement>) => {
          const r = e.currentTarget.getBoundingClientRect()
          x.set((e.clientX - r.left) / r.width)
          y.set((e.clientY - r.top) / r.height)
        }
      : undefined,
    onPointerLeave: enabled
      ? () => {
          x.set(0.5)
          y.set(0.5)
        }
      : undefined,
  }
}

export const AppCard = memo(function AppCard({ app, className }: { app: MobileApp; className?: string }) {
  const tilt = useTilt()
  const ref = useRef<HTMLAnchorElement>(null)
  const cat = categoryBySlug[app.category]
  const seen = useImpression<HTMLDivElement>(app.id)
  return (
    <motion.div ref={seen} style={tilt.style} className={cn('group/card h-full', className)}>
      <Link
        ref={ref}
        to={`/app/${app.slug}`}
        data-cursor="View"
        onPointerMove={(e) => {
          trackSpotlight(e)
          tilt.onPointerMove?.(e)
        }}
        onPointerLeave={tilt.onPointerLeave}
        className="relative flex h-full flex-col overflow-hidden rounded-[20px] glass transition-[box-shadow,border-color] duration-300 hover:border-line-strong hover:shadow-lg focus-visible:shadow-[var(--ring)]"
        aria-label={`${app.name} — ${app.tagline}`}
      >
        <span className={spotlightClass} aria-hidden />
        <div
          className="relative h-44 overflow-hidden bg-surface-2"
        >
          <div className="absolute inset-0 grid-bg opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
          <div className="absolute inset-0 grid place-items-center transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover/card:scale-[1.06]">
            <AppIcon app={app} size="xl" className="shadow-md" />
          </div>
          <div className="absolute inset-x-3 top-3 flex items-start justify-between">
            <CampaignBadgeChip app={app} />
            <PlatformChips platforms={app.platforms} className="ml-auto" />
          </div>
        </div>
        <div className="relative flex flex-1 flex-col p-4 pt-0">
          <div className="mt-3.5 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-display text-[15px] font-bold text-fg">{app.name}</h3>
              <p
                className="text-xs font-medium text-[var(--cat-light)] dark:text-[var(--cat-dark)]"
                style={{ '--cat-light': cat.colors[1], '--cat-dark': cat.colors[0] } as React.CSSProperties}
              >
                {cat.name}
              </p>
            </div>
            <RatingPill value={app.rating} />
          </div>
          <p className="mb-4 mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">{app.tagline}</p>
          {app.reward && (
            <p className="-mt-2 mb-4 inline-flex w-fit items-center gap-1.5 rounded-lg bg-gold-500/12 px-2 py-1 text-xs font-medium text-[#9A6400] dark:text-gold-500">
              <Gift className="size-3.5" aria-hidden /> {app.reward}
            </p>
          )}
          <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
            {app.downloads > 0 ? (
              <span className="num inline-flex items-center gap-1.5 text-xs font-medium text-subtle">
                <Download className="size-3.5" aria-hidden />
                {formatDownloads(app.downloads)} downloads
              </span>
            ) : (
              <span />
            )}
            <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent-text">
              Explore
              <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover/card:-translate-y-0.5 group-hover/card:translate-x-0.5" aria-hidden />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
})

export function AppCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[20px] glass">
      <Skeleton className="h-44 rounded-none" />
      <div className="p-4 pt-0">
        <Skeleton className="-mt-6 size-12 rounded-[14px] ring-4 ring-surface" />
        <Skeleton className="mt-3 h-4 w-2/3" />
        <Skeleton className="mt-2 h-3 w-1/3" />
        <Skeleton className="mt-4 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-4/5" />
        <Skeleton className="mt-5 h-3 w-1/2" />
      </div>
    </div>
  )
}

/** Compact horizontal row for lists, search results and "similar apps". */
export const AppRow = memo(function AppRow({ app, onNavigate, trailing }: { app: MobileApp; onNavigate?: () => void; trailing?: React.ReactNode }) {
  const cat = categoryBySlug[app.category]
  return (
    <Link
      to={`/app/${app.slug}`}
      onClick={onNavigate}
      className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-2"
    >
      <AppIcon app={app} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-fg">{app.name}</p>
        <p className="truncate text-xs text-subtle">
          {cat.name} · {app.tagline}
        </p>
      </div>
      {trailing ?? <RatingPill value={app.rating} />}
    </Link>
  )
})
