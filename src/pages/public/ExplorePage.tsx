import { AnimatePresence, motion } from 'framer-motion'
import { Search, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { categories, categoryBySlug } from '@/data/categories'
import { useDebounce } from '@/hooks/useDebounce'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { appsService, type AppSort } from '@/services/appsService'
import type { CategorySlug, Platform } from '@/types'
import { cn } from '@/utils/cn'
import { AppCard, AppCardSkeleton } from '@/components/apps/AppCard'
import { Button } from '@/components/ui/Button'
import { DynamicIcon } from '@/components/ui/DynamicIcon'
import { EmptyState, ErrorState } from '@/components/ui/Feedback'
import { Input, Select } from '@/components/ui/Form'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { PageTransition } from '@/components/layout/PageTransition'

const PAGE = 12

export default function ExplorePage({ fixedCategory }: { fixedCategory?: CategorySlug }) {
  const [params, setParams] = useSearchParams()
  const category = fixedCategory ?? ((params.get('category') as CategorySlug | null) || 'all')
  const platform = (params.get('platform') as Platform | null) || 'all'
  const sort = (params.get('sort') as AppSort | null) || 'popular'
  const minRating = Number(params.get('rating') || 0)
  const q = params.get('q') || ''
  const limit = Number(params.get('n') || PAGE)
  const debouncedQ = useDebounce(q, 200)
  const cat = category !== 'all' ? categoryBySlug[category] : undefined
  useDocumentTitle(cat ? `${cat.name} apps` : 'Explore apps')

  const update = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '' || v === 'all' || v === 0) next.delete(k)
      else next.set(k, String(v))
    }
    if (!('n' in patch)) next.delete('n')
    setParams(next, { replace: true })
  }

  const key = `apps:list:${category}:${platform}:${sort}:${minRating}:${debouncedQ}`
  const { data, error, refetch, loading } = useQuery(
    key,
    () => appsService.list({ category, platform, sort, minRating, q: debouncedQ }),
    { keepPrevious: true },
  )
  const visible = useMemo(() => data?.slice(0, limit) ?? [], [data, limit])
  const activeFilters = [platform !== 'all', minRating > 0, !!q, !fixedCategory && category !== 'all'].filter(Boolean).length

  return (
    <PageTransition>
      <section className="relative overflow-hidden border-b border-line">
        {cat && (
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{ background: `radial-gradient(60% 100% at 85% 0%, ${cat.colors[0]}, transparent 70%)` }}
            aria-hidden
          />
        )}
        <div className="container-page relative py-12 sm:py-16">
          {cat ? (
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-2xl text-white shadow-lg" style={{ background: `linear-gradient(145deg, ${cat.colors[0]}, ${cat.colors[1]})` }}>
                <DynamicIcon name={cat.icon} className="size-7" />
              </span>
              <div>
                <p className="eyebrow">Category</p>
                <h1 className="font-display text-4xl font-bold tracking-[-0.03em] text-fg sm:text-5xl">{cat.name}</h1>
              </div>
            </div>
          ) : (
            <>
              <p className="eyebrow !text-accent-text">Explore</p>
              <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.03em] text-fg sm:text-5xl">Every app, carefully chosen</h1>
            </>
          )}
          <p className="mt-3 max-w-xl text-muted">{cat ? cat.description : 'Filter by category, platform and rating to find the right app for you. All listings are reviewed by our team.'}</p>
        </div>
      </section>

      <div className="sticky top-16 z-30 border-b border-line bg-bg/55 backdrop-blur-2xl backdrop-saturate-150">
        <div className="container-page flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
          <div className="lg:w-72">
            <Input
              leftIcon={<Search />}
              placeholder="Search apps"
              value={q}
              onChange={(e) => update({ q: e.target.value })}
              aria-label="Search apps"
              rightSlot={q ? <button onClick={() => update({ q: null })} className="rounded-md p-1 text-subtle hover:text-fg" aria-label="Clear search"><X className="size-4" /></button> : undefined}
            />
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <SegmentedControl
              label="Platform"
              value={platform}
              onChange={(v) => update({ platform: v })}
              options={[{ value: 'all', label: 'All' }, { value: 'ios', label: 'iOS' }, { value: 'android', label: 'Android' }]}
            />
            <Select selectSize="md" value={String(minRating)} onChange={(e) => update({ rating: Number(e.target.value) })} aria-label="Minimum rating" className="w-36">
              <option value="0">Any rating</option>
              <option value="4.5">4.5★ & up</option>
              <option value="4.7">4.7★ & up</option>
            </Select>
            <Select value={sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort by" className="w-40">
              <option value="popular">Most popular</option>
              <option value="rating">Top rated</option>
              <option value="trending">Fastest growing</option>
              <option value="newest">Recently updated</option>
              <option value="name">A–Z</option>
            </Select>
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" leftIcon={<X className="size-3.5" />} onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
              </Button>
            )}
            <p className="num ml-auto hidden text-sm text-subtle lg:block" aria-live="polite">
              {data ? `${data.length} apps` : ' '}
            </p>
          </div>
        </div>
        {!fixedCategory && (
          <div className="container-page flex gap-2 overflow-x-auto pb-3 scrollbar-none">
            <CategoryChip active={category === 'all'} onClick={() => update({ category: null })} label="All categories" />
            {categories.map((c) => (
              <CategoryChip key={c.slug} active={category === c.slug} onClick={() => update({ category: c.slug })} label={c.name} icon={c.icon} colors={c.colors} />
            ))}
          </div>
        )}
      </div>

      <section className="container-page py-10" aria-label="Apps">
        {error ? (
          <ErrorState title="Unable to load apps" error={error} onRetry={refetch} />
        ) : data && data.length === 0 ? (
          <EmptyState
            icon={<SearchX />}
            title="No apps match these filters"
            description="Try removing a filter or searching for something broader, like a category or what you want to get done."
            action={<Button variant="outline" leftIcon={<SlidersHorizontal className="size-4" />} onClick={() => setParams(new URLSearchParams(), { replace: true })}>Reset filters</Button>}
          />
        ) : (
          <>
            <div className={cn('grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', loading && data && 'opacity-60')}>
              <AnimatePresence mode="popLayout" initial={false}>
                {data
                  ? visible.map((a) => (
                      <motion.div key={a.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.28 }}>
                        <AppCard app={a} />
                      </motion.div>
                    ))
                  : Array.from({ length: 8 }).map((_, i) => <AppCardSkeleton key={i} />)}
              </AnimatePresence>
            </div>
            {data && data.length > limit && (
              <div className="mt-10 flex justify-center">
                <Button variant="outline" size="lg" onClick={() => update({ n: limit + PAGE })}>
                  Show more apps ({data.length - limit} left)
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </PageTransition>
  )
}

function CategoryChip({ active, onClick, label, icon, colors }: { active: boolean; onClick: () => void; label: string; icon?: string; colors?: [string, string] }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-all sm:h-8',
        active ? 'border-fg bg-fg text-bg' : 'border-line bg-surface text-muted hover:border-line-strong hover:text-fg',
      )}
    >
      {icon && colors && (
        <span className="grid size-4 place-items-center rounded-[5px] text-white" style={{ background: `linear-gradient(140deg, ${colors[0]}, ${colors[1]})` }}>
          <DynamicIcon name={icon} className="size-2.5" />
        </span>
      )}
      {label}
    </button>
  )
}
