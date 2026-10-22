import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, History, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { categoryBySlug } from '@/data/categories'
import { useQuery } from '@/hooks/useQuery'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { appsService } from '@/services/appsService'
import { AppIcon } from '@/components/ui/AppIcon'

/** Returning visitors: resume exactly where they left off. Renders nothing for first-time visitors. */
export function RecentlyViewed() {
  const { ids, clear } = useRecentlyViewed()
  const { data } = useQuery('apps:list:all', () => appsService.list())
  const items = ids.map((id) => data?.find((a) => a.id === id)).filter((a): a is NonNullable<typeof a> => !!a)

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
          aria-labelledby="recent-title"
        >
          <div className="container-page pt-10">
            <div className="flex items-center justify-between gap-3">
              <h2 id="recent-title" className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
                <History className="size-3.5" aria-hidden /> Pick up where you left off
              </h2>
              <button onClick={clear} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-subtle transition hover:bg-surface-2 hover:text-fg">
                <X className="size-3" aria-hidden /> Clear history
              </button>
            </div>
            <ul className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:px-0">
              {items.map((a, i) => (
                <motion.li key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="shrink-0">
                  <Link
                    to={`/app/${a.slug}`}
                    data-cursor="Resume"
                    className="group flex w-64 items-center gap-3 rounded-2xl glass p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md"
                  >
                    <AppIcon app={a} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-fg">{a.name}</span>
                      <span className="block truncate text-xs text-subtle">{categoryBySlug[a.category]?.name}{a.rating > 0 && ` · ★ ${a.rating.toFixed(1)}`}</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg" aria-hidden />
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
