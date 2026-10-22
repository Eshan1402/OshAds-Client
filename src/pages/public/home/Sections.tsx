import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Download, Sparkles } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { categories } from '@/data/categories'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useQuery } from '@/hooks/useQuery'
import { appsService } from '@/services/appsService'
import type { CategorySlug } from '@/types'
import { cn } from '@/utils/cn'
import { formatDownloads } from '@/utils/format'
import { AppCard, AppCardSkeleton } from '@/components/apps/AppCard'
import { CategoryTile } from '@/components/apps/CategoryTile'
import { AppIcon } from '@/components/ui/AppIcon'
import { ButtonLink } from '@/components/ui/Button'
import { DynamicIcon } from '@/components/ui/DynamicIcon'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { useStaggerReveal } from '@/hooks/useStaggerReveal'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { Eyebrow, SplitReveal } from '@/components/motion/SplitReveal'

/** "Plain words | serif accent" — text after the pipe renders in the italic brand serif. */
function splitAccent(title: string) {
  const [plain, accent] = title.split('|').map((t) => t.trim())
  return accent ? [plain, { text: accent, className: 'font-serif font-normal italic tracking-[-0.02em] text-gradient-brand' }] : [plain]
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  id,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  id?: string
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        {typeof title === 'string' ? (
          <SplitReveal id={id} className="font-display text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-fg sm:text-[52px]" lines={splitAccent(title)} />
        ) : (
          <h2 id={id} className="font-display text-4xl font-semibold tracking-[-0.04em] text-fg sm:text-[52px]">{title}</h2>
        )}
        {description && (
          <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.25, duration: 0.6 }} className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            {description}
          </motion.p>
        )}
      </div>
      {action}
    </div>
  )
}

export function CampaignTicker() {
  const { data } = useQuery('apps:featured', () => appsService.featured())
  if (!data) return <div className="h-14 border-y border-line" />
  const row = [...data, ...data]
  return (
    <div className="group relative overflow-hidden border-y border-line bg-surface/40 py-3 backdrop-blur-xl" aria-label="Live campaigns">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-bg to-transparent" />
      <div className="flex w-max animate-marquee gap-8 group-hover:[animation-play-state:paused]">
        {row.map((a, i) => (
          <Link key={`${a.id}-${i}`} to={`/app/${a.slug}`} className="flex min-h-10 items-center gap-2.5 text-sm" tabIndex={i >= data.length ? -1 : 0}>
            <AppIcon app={a} size="xs" />
            <span className="font-semibold text-fg">{a.name}</span>
            <span className="text-subtle">{a.badge}</span>
            {a.downloads > 0 && <span className="num text-subtle">· {formatDownloads(a.downloads)}</span>}
          </Link>
        ))}
      </div>
    </div>
  )
}

export function CategoriesSection() {
  const { data } = useQuery('apps:list:all', () => appsService.list())
  const counts = (slug: string) => data?.filter((a) => a.category === slug).length
  const grid = useRef<HTMLDivElement>(null)
  useStaggerReveal(grid)
  return (
    <section className="container-page py-20 sm:py-24" aria-labelledby="cat-title">
      <SectionHeader
        id="cat-title"
        eyebrow="Categories"
        title="Find apps by | what matters to you."
        description="Small-loan apps from our clients, each linked to its official website."
        action={<ButtonLink to="/categories" variant="outline" rightIcon={<ArrowRight className="size-4" />}>All categories</ButtonLink>}
      />
      <div ref={grid} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((c) => (
          <div key={c.slug} data-reveal>
            <CategoryTile category={c} count={counts(c.slug)} />
          </div>
        ))}
      </div>
    </section>
  )
}

const exploreFilters: Array<{ value: CategorySlug | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  ...categories.map((c) => ({ value: c.slug, label: c.name })),
]

export function ExploreSection() {
  const [cat, setCat] = useState<CategorySlug | 'all'>('all')
  const { data, error, refetch } = useQuery(`apps:list:${cat}:popular`, () => appsService.list({ category: cat, sort: 'popular' }), { keepPrevious: true })
  return (
    <section className="container-page py-20 sm:py-24" aria-labelledby="explore-title">
      <SectionHeader
        id="explore-title"
        eyebrow="Explore campaigns"
        title="Apps our community | is loving."
        description="Hand-picked campaigns from developers we work with directly — with exclusive rewards on some."
        action={<ButtonLink to="/explore" variant="outline" rightIcon={<ArrowRight className="size-4" />}>Explore all apps</ButtonLink>}
      />
      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0" role="tablist" aria-label="Filter by category">
        {exploreFilters.map((f) => (
          <button
            key={f.value}
            role="tab"
            aria-selected={cat === f.value}
            onClick={() => setCat(f.value)}
            className={cn(
              'relative h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors',
              cat === f.value ? 'text-bg' : 'glass text-muted hover:text-fg',
            )}
          >
            {cat === f.value && <motion.span layoutId="explore-chip" className="absolute inset-0 rounded-full bg-fg" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            <span className="relative">{f.label}</span>
          </button>
        ))}
      </div>
      {error ? (
        <ErrorState title="Unable to load apps" error={error} onRetry={refetch} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {data
              ? data.slice(0, 8).map((a) => (
                  <motion.div key={a.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }}>
                    <AppCard app={a} />
                  </motion.div>
                ))
              : Array.from({ length: 8 }).map((_, i) => <AppCardSkeleton key={i} />)}
          </AnimatePresence>
        </div>
      )}
    </section>
  )
}

const interestOptions: CategorySlug[] = categories.map((c) => c.slug)

export function RecommendedSection() {
  const [interests, setInterests] = useLocalStorage<CategorySlug[]>('adwin:interests', ['loans'])
  const { ids: viewed } = useRecentlyViewed()
  const key = `apps:recommended:${[...interests].sort().join(',')}:${viewed.slice(0, 4).join(',')}`
  const { data } = useQuery(key, () => appsService.recommended(interests, 6, viewed), { keepPrevious: true })
  const toggle = (c: CategorySlug) => setInterests((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  return (
    <section className="border-y border-line bg-surface/30 py-20 sm:py-24" aria-labelledby="rec-title">
      <div className="container-page grid gap-10 lg:grid-cols-[340px_1fr] lg:gap-14">
        <div>
          <Eyebrow>For you</Eyebrow>
          <SplitReveal id="rec-title" className="font-display text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-fg sm:text-[52px]" lines={['Apps you', { text: 'might love.', className: 'font-serif font-normal italic text-gradient-brand' }]} />
          <p className="mt-3 text-muted">Tell us what you’re into and we’ll tune these picks. Stored only on this device.</p>
          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Your interests">
            {interestOptions.map((slug) => {
              const c = categories.find((x) => x.slug === slug)!
              const on = interests.includes(slug)
              return (
                <button
                  key={slug}
                  onClick={() => toggle(slug)}
                  aria-pressed={on}
                  className={cn(
                    'inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-all duration-200 active:scale-95 sm:h-9',
                    on ? 'border-transparent bg-accent-soft text-accent-text ring-1 ring-accent/30' : 'border-line text-muted hover:border-line-strong hover:text-fg',
                  )}
                >
                  {on ? <Check className="size-3.5" aria-hidden /> : <DynamicIcon name={c.icon} className="size-3.5" />}
                  {c.name}
                </button>
              )
            })}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {data
              ? data.map((a, i) => (
                  <motion.div key={a.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, delay: i * 0.03 }}>
                    <Link
                      to={`/app/${a.slug}`}
                      className="group flex items-center gap-4 rounded-2xl glass p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface hover:shadow-md"
                    >
                      <AppIcon app={a} size="lg" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-display text-base font-bold text-fg">{a.name}</h3>
                          {interests.includes(a.category) && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent-text">
                              <Sparkles className="size-2.5" aria-hidden /> Match
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[13px] text-muted">{a.tagline}</p>
                        <p className="mt-1 line-clamp-1 text-xs font-medium text-accent-text">
                          {a.reason}
                          {a.sponsored && <span className="ml-1.5 font-normal text-subtle">· Sponsored</span>}
                        </p>
                        <p className="num mt-1.5 flex items-center gap-3 text-xs text-subtle">
                          {a.rating > 0 && <span>★ {a.rating.toFixed(1)}</span>}
                          {a.downloads > 0 && <span className="inline-flex items-center gap-1"><Download className="size-3" aria-hidden />{formatDownloads(a.downloads)}</span>}
                        </p>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-accent-text" aria-hidden />
                    </Link>
                  </motion.div>
                ))
              : Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[106px] rounded-2xl" />)}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
