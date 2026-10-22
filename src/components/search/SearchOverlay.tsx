import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Clock, CornerDownLeft, Search, SearchX, TrendingUp, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { categories } from '@/data/categories'
import { useDebounce } from '@/hooks/useDebounce'
import { useQuery } from '@/hooks/useQuery'
import { appsService } from '@/services/appsService'
import { popularSearches, searchService } from '@/services/searchService'
import { cn } from '@/utils/cn'
import { AppIcon } from '@/components/ui/AppIcon'
import { DynamicIcon } from '@/components/ui/DynamicIcon'
import { Kbd } from '@/components/ui/Misc'
import { RatingPill } from '@/components/ui/Rating'
import { Skeleton } from '@/components/ui/Feedback'
import { useFocusTrap } from '@/components/ui/Modal'
import { searchStore, useSearchOpen } from './searchStore'

interface ResultItem {
  key: string
  href: string
  label: string
}

export function SearchOverlay() {
  const open = useSearchOpen()
  const navigate = useNavigate()
  const panel = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const [recent, setRecent] = useState<string[]>([])
  const debounced = useDebounce(q.trim(), 140)

  useFocusTrap(open, panel, searchStore.close)

  useEffect(() => {
    if (open) {
      setRecent(searchService.recent())
      setActive(0)
    } else setQ('')
  }, [open])

  // Global shortcuts: ⌘K / Ctrl+K and "/" open search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /input|textarea|select/i.test((e.target as HTMLElement).tagName)
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        searchStore.toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = useQuery(open && debounced ? `search:${debounced}` : null, () => searchService.search(debounced), { keepPrevious: true })
  const suggested = useQuery(open ? 'apps:trending:4' : null, () => appsService.trending(4))

  const items: ResultItem[] = useMemo(() => {
    if (!debounced || !results.data) return []
    return [
      ...results.data.apps.map((a) => ({ key: a.id, href: `/app/${a.slug}`, label: a.name })),
      ...results.data.categories.map((c) => ({ key: c.slug, href: `/categories/${c.slug}`, label: c.name })),
      { key: 'all', href: `/search?q=${encodeURIComponent(debounced)}`, label: `All results for “${debounced}”` },
    ]
  }, [debounced, results.data])

  useEffect(() => setActive(0), [debounced])

  const go = (href: string) => {
    if (q.trim()) searchService.remember(q)
    searchStore.close()
    navigate(href)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!items.length) {
      if (e.key === 'Enter' && q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + items.length) % items.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(items[active].href)
    }
  }

  const itemProps = (href: string, key: string) => {
    const idx = items.findIndex((i) => i.key === key)
    return {
      id: `sr-${key}`,
      role: 'option' as const,
      'aria-selected': idx === active,
      onMouseEnter: () => setActive(idx),
      onClick: () => go(href),
      className: cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors', idx === active ? 'bg-surface-2' : ''),
    }
  }

  const data = results.data
  const empty = debounced && data && !data.apps.length && !data.categories.length

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[85] flex items-start justify-center px-3 pt-[8vh] sm:px-6 sm:pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-ink-950/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={searchStore.close}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Search apps"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.14 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl glass-strong shadow-xl"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-5 shrink-0 text-subtle" aria-hidden />
              <input
                ref={input}
                data-autofocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search apps, categories or developers"
                className="h-14 w-full bg-transparent text-base text-fg placeholder:text-subtle focus:outline-none"
                role="combobox"
                aria-expanded={items.length > 0}
                aria-controls="search-results"
                aria-activedescendant={items[active] ? `sr-${items[active].key}` : undefined}
                aria-autocomplete="list"
                type="search"
              />
              {q && (
                <button onClick={() => { setQ(''); input.current?.focus() }} className="rounded-md p-1 text-subtle hover:text-fg" aria-label="Clear search">
                  <X className="size-4" />
                </button>
              )}
              <button onClick={searchStore.close} className="hidden sm:block" aria-label="Close search">
                <Kbd>Esc</Kbd>
              </button>
            </div>

            <div id="search-results" role="listbox" className="max-h-[60vh] overflow-y-auto p-2">
              {!debounced && (
                <div className="space-y-5 p-2">
                  {recent.length > 0 && (
                    <section>
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="eyebrow">Recent</h3>
                        <button
                          onClick={() => {
                            searchService.clearRecent()
                            setRecent([])
                          }}
                          className="text-xs font-medium text-subtle hover:text-fg"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recent.map((r) => (
                          <button key={r} onClick={() => setQ(r)} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[13px] text-muted transition hover:border-line-strong hover:text-fg">
                            <Clock className="size-3.5" aria-hidden /> {r}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                  <section>
                    <h3 className="eyebrow mb-2">Popular searches</h3>
                    <div className="flex flex-wrap gap-2">
                      {popularSearches.map((p) => (
                        <button key={p} onClick={() => setQ(p)} className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-[13px] text-muted transition hover:bg-accent-soft hover:text-accent-text">
                          <TrendingUp className="size-3.5" aria-hidden /> {p}
                        </button>
                      ))}
                    </div>
                  </section>
                  <section>
                    <h3 className="eyebrow mb-2">Suggested apps</h3>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {suggested.data
                        ? suggested.data.map((a) => (
                            <button key={a.id} onClick={() => go(`/app/${a.slug}`)} className="flex items-center gap-3 rounded-xl p-2 text-left transition hover:bg-surface-2">
                              <AppIcon app={a} size="sm" />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-fg">{a.name}</span>
                                <span className="block truncate text-xs text-subtle">{a.tagline}</span>
                              </span>
                            </button>
                          ))
                        : Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
                    </div>
                  </section>
                  <section>
                    <h3 className="eyebrow mb-2">Browse categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((c) => (
                        <button key={c.slug} onClick={() => go(`/categories/${c.slug}`)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[13px] font-medium text-muted transition hover:border-line-strong hover:text-fg">
                          <span className="grid size-5 place-items-center rounded-md text-white" style={{ background: `linear-gradient(140deg, ${c.colors[0]}, ${c.colors[1]})` }}>
                            <DynamicIcon name={c.icon} className="size-3" />
                          </span>
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {debounced && !data && (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
                </div>
              )}

              {empty && (
                <div className="flex flex-col items-center px-6 py-10 text-center">
                  <SearchX className="mb-3 size-8 text-subtle" aria-hidden />
                  <p className="font-semibold text-fg">No apps match “{debounced}”</p>
                  <p className="mt-1 text-sm text-muted">Try a category like “finance” or a goal like “learn a language”.</p>
                </div>
              )}

              {debounced && data && !empty && (
                <div className={cn('transition-opacity', results.loading && 'opacity-60')}>
                  {data.apps.length > 0 && <h3 className="eyebrow px-3 pb-1 pt-2">Apps</h3>}
                  {data.apps.map((a) => (
                    <button key={a.id} {...itemProps(`/app/${a.slug}`, a.id)}>
                      <AppIcon app={a} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-fg">{a.name}</span>
                        <span className="block truncate text-xs text-subtle">{a.developer} · {a.tagline}</span>
                      </span>
                      <RatingPill value={a.rating} />
                    </button>
                  ))}
                  {data.categories.length > 0 && <h3 className="eyebrow px-3 pb-1 pt-3">Categories</h3>}
                  {data.categories.map((c) => (
                    <button key={c.slug} {...itemProps(`/categories/${c.slug}`, c.slug)}>
                      <span className="grid size-9 place-items-center rounded-[10px] text-white" style={{ background: `linear-gradient(140deg, ${c.colors[0]}, ${c.colors[1]})` }}>
                        <DynamicIcon name={c.icon} className="size-4" />
                      </span>
                      <span className="text-sm font-semibold text-fg">{c.name}</span>
                    </button>
                  ))}
                  {data.clients.length > 0 && (
                    <p className="px-3 pt-3 text-xs text-subtle">
                      Developers: {data.clients.map((c) => `${c.name} (${c.apps.length})`).join(', ')}
                    </p>
                  )}
                  <div className="mt-2 border-t border-line pt-2">
                    <button {...itemProps(`/search?q=${encodeURIComponent(debounced)}`, 'all')}>
                      <ArrowRight className="size-4 text-accent-text" aria-hidden />
                      <span className="text-sm font-medium text-fg">See all results for “{debounced}”</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="hidden items-center gap-4 border-t border-line bg-surface-2/60 px-4 py-2.5 text-xs text-subtle sm:flex">
              <span className="inline-flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
              <span className="inline-flex items-center gap-1.5"><Kbd><CornerDownLeft className="size-3" /></Kbd> open</span>
              <span className="inline-flex items-center gap-1.5"><Kbd>⌘</Kbd><Kbd>K</Kbd> toggle</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
