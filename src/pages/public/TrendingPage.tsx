import { motion } from 'framer-motion'
import { ArrowUpRight, Download, Flame, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { categoryBySlug } from '@/data/categories'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { appsService } from '@/services/appsService'
import { formatDownloads } from '@/utils/format'
import { AppIcon } from '@/components/ui/AppIcon'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Stars } from '@/components/ui/Rating'
import { PageTransition } from '@/components/layout/PageTransition'

export default function TrendingPage() {
  useDocumentTitle('Trending apps')
  const { data, error, refetch } = useQuery('apps:list:trending', () => appsService.list({ sort: 'trending' }))
  const top = data?.slice(0, 3) ?? []
  const rest = data?.slice(3, 20) ?? []

  return (
    <PageTransition>
      <section className="container-page py-12 sm:py-16">
        <p className="eyebrow inline-flex items-center gap-1.5 !text-accent-text"><Flame className="size-3.5" /> Last 7 days</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.03em] text-fg sm:text-5xl">Trending right now</h1>
        <p className="mt-3 max-w-xl text-muted">Ranked by visits and download clicks on OshAds over the last 7 days. Growth shows the change from the week before.</p>

        {error && <ErrorState error={error} onRetry={refetch} />}

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {data
            ? top.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.5 }}>
                  <Link
                    to={`/app/${a.slug}`}
                    className="group relative flex h-72 flex-col overflow-hidden rounded-[24px] glass p-6 text-fg shadow-lg transition-transform duration-300 hover:-translate-y-1"
                  >
                    <span className="num font-display text-7xl font-extrabold leading-none tracking-tighter text-line-strong">#{i + 1}</span>
                    <div className="mt-auto flex items-center gap-3">
                      <div>
                        <h2 className="font-display text-xl font-bold">{a.name}</h2>
                        <p className="text-sm text-subtle">{categoryBySlug[a.category].name}</p>
                      </div>
                    </div>
                    {a.weeklyGrowth > 0 && (
                      <p className="num mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
                        <TrendingUp className="size-3.5" aria-hidden /> +{a.weeklyGrowth.toFixed(1)}% this week
                      </p>
                    )}
                    <AppIcon app={a} size="xl" className="absolute right-6 top-6 shadow-md transition-transform duration-500 group-hover:scale-105" />
                  </Link>
                </motion.div>
              ))
            : Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-[24px]" />)}
        </div>

        <ol className="mt-8 divide-y divide-line overflow-hidden rounded-[20px] glass">
          {data
            ? rest.map((a, i) => (
                <motion.li key={a.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: (i % 6) * 0.04 }}>
                  <Link to={`/app/${a.slug}`} className="group grid grid-cols-[40px_1fr_auto] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2 sm:grid-cols-[56px_1fr_140px_120px_100px] sm:gap-4 sm:px-6">
                    <span className="num font-display text-lg font-bold text-subtle">{String(i + 4).padStart(2, '0')}</span>
                    <span className="flex min-w-0 items-center gap-3">
                      <AppIcon app={a} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-fg">{a.name}</span>
                        <span className="block truncate text-xs text-subtle">{categoryBySlug[a.category].name} · {a.developer}</span>
                      </span>
                    </span>
                    {a.rating > 0 && <span className="hidden items-center gap-1.5 sm:flex"><Stars value={a.rating} size={12} /><span className="num text-xs font-semibold text-fg">{a.rating.toFixed(1)}</span></span>}
                    {a.downloads > 0 && <span className="num hidden items-center gap-1 text-sm text-muted sm:flex"><Download className="size-3.5" aria-hidden />{formatDownloads(a.downloads)}</span>}
                    <span className="flex items-center justify-end gap-2">
                      {a.weeklyGrowth !== 0 && (
                        <span className={`num text-sm font-semibold ${a.weeklyGrowth > 0 ? 'text-success' : 'text-danger'}`}>
                          {a.weeklyGrowth > 0 ? '+' : ''}{a.weeklyGrowth.toFixed(1)}%
                        </span>
                      )}
                      <ArrowUpRight className="hidden size-4 text-subtle transition group-hover:text-accent-text sm:block" aria-hidden />
                    </span>
                  </Link>
                </motion.li>
              ))
            : Array.from({ length: 8 }).map((_, i) => <li key={i} className="px-6 py-3.5"><Skeleton className="h-10" /></li>)}
        </ol>
      </section>
    </PageTransition>
  )
}
