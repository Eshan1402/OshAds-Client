import { Search, SearchX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDebounce } from '@/hooks/useDebounce'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { popularSearches, searchService } from '@/services/searchService'
import { AppCard, AppCardSkeleton } from '@/components/apps/AppCard'
import { CategoryTile } from '@/components/apps/CategoryTile'
import { EmptyState, ErrorState } from '@/components/ui/Feedback'
import { Input } from '@/components/ui/Form'
import { PageTransition } from '@/components/layout/PageTransition'

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const debounced = useDebounce(q.trim(), 220)
  useDocumentTitle(debounced ? `“${debounced}”` : 'Search')

  useEffect(() => {
    setParams(debounced ? { q: debounced } : {}, { replace: true })
    if (debounced.length > 2) searchService.remember(debounced)
  }, [debounced, setParams])

  const { data, error, refetch, loading } = useQuery(debounced ? `search:${debounced}` : null, () => searchService.search(debounced), { keepPrevious: true })

  return (
    <PageTransition>
      <section className="container-page py-12 sm:py-16">
        <h1 className="font-display text-4xl font-bold tracking-[-0.03em] text-fg sm:text-5xl">Search</h1>
        <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-6 max-w-2xl">
          <Input inputSize="lg" leftIcon={<Search />} value={q} onChange={(e) => setQ(e.target.value)} placeholder="App name, category, developer or keyword" aria-label="Search apps" autoFocus type="search" />
        </form>
        {!debounced && (
          <div className="mt-6 flex flex-wrap gap-2">
            {popularSearches.map((p) => (
              <button key={p} onClick={() => setQ(p)} className="rounded-full glass px-3 py-1.5 text-sm text-muted transition hover:border-line-strong hover:text-fg">{p}</button>
            ))}
          </div>
        )}
        <div className="mt-10" aria-live="polite">
          {error && <ErrorState error={error} onRetry={refetch} />}
          {debounced && !data && !error && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <AppCardSkeleton key={i} />)}</div>
          )}
          {debounced && data && (
            <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              {data.apps.length === 0 && data.categories.length === 0 ? (
                <EmptyState
                  icon={<SearchX />}
                  title={`No results for “${debounced}”`}
                  description="Check the spelling, or try a broader term like a category name."
                  action={<Link to="/explore" className="text-sm font-semibold text-accent-text hover:underline">Browse all apps →</Link>}
                />
              ) : (
                <>
                  <p className="num mb-5 text-sm text-subtle">{data.apps.length} app{data.apps.length === 1 ? '' : 's'} found</p>
                  {data.categories.length > 0 && (
                    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{data.categories.map((c) => <CategoryTile key={c.slug} category={c} />)}</div>
                  )}
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{data.apps.map((a) => <AppCard key={a.id} app={a} />)}</div>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </PageTransition>
  )
}
