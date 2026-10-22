import { AppWindow, LayoutGrid, List, Plus, Search, SearchX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { categories, categoryBySlug } from '@/data/categories'
import { useDebounce } from '@/hooks/useDebounce'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useQuery } from '@/hooks/useQuery'
import { appsService } from '@/services/appsService'
import { campaignsService } from '@/services/campaignsService'
import type { AppStatus, MobileApp } from '@/types'
import { formatCompact, formatDownloads } from '@/utils/format'
import { AppIcon } from '@/components/ui/AppIcon'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Input, Select } from '@/components/ui/Form'
import { RatingPill } from '@/components/ui/Rating'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { PageTransition } from '@/components/layout/PageTransition'

export const appStatusBadge: Record<AppStatus, { tone: BadgeTone; label: string }> = {
  live: { tone: 'success', label: 'Live' },
  draft: { tone: 'iris', label: 'Draft' },
  paused: { tone: 'warning', label: 'Paused' },
  in_review: { tone: 'info', label: 'In review' },
}

export default function AppsPage() {
  useDocumentTitle('Applications')
  const { can } = useAuth()
  const [view, setView] = useLocalStorage<'grid' | 'list'>('adwin:apps-view', 'grid')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [status, setStatus] = useState<AppStatus | 'all'>('all')
  const dq = useDebounce(q, 180)
  const { data, error, refetch } = useQuery('apps:all:admin', () => appsService.list({ includeHidden: true }))
  const camps = useQuery('campaigns:list:all::', () => campaignsService.list())
  const activeByApp = useMemo(() => {
    const m = new Map<string, number>()
    camps.data?.forEach((c) => c.status === 'active' && m.set(c.appId, (m.get(c.appId) ?? 0) + 1))
    return m
  }, [camps.data])
  const list = useMemo(
    () => data?.filter((a) => (cat === 'all' || a.category === cat) && (status === 'all' || a.status === status) && (!dq || `${a.name} ${a.developer}`.toLowerCase().includes(dq.toLowerCase()))),
    [data, cat, status, dq],
  )

  return (
    <PageTransition>
      <PageHeader
        title="Applications"
        description="Every app promoted on OshAds, with its listing status and campaign activity."
        actions={can('apps:write') && <ButtonLink to="/dashboard/apps/new" leftIcon={<Plus className="size-4" />}>Add application</ButtonLink>}
      />
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="sm:w-72"><Input inputSize="sm" leftIcon={<Search />} placeholder="Search apps or developers" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search applications" /></div>
        <Select selectSize="sm" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category" className="sm:w-44">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </Select>
        <Select selectSize="sm" value={status} onChange={(e) => setStatus(e.target.value as AppStatus | 'all')} aria-label="Status" className="sm:w-36">
          <option value="all">Any status</option>
          {Object.entries(appStatusBadge).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
        <SegmentedControl className="sm:ml-auto" label="View" size="sm" value={view} onChange={setView} options={[{ value: 'grid', label: 'Grid', icon: <LayoutGrid /> }, { value: 'list', label: 'List', icon: <List /> }]} />
      </div>

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !list ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={data?.length ? <SearchX /> : <AppWindow />}
            title={data?.length ? 'No applications match' : 'No applications yet'}
            description={data?.length ? 'Try a different search or clear the filters.' : 'Add a client’s app to start building campaigns around it.'}
            action={can('apps:write') ? <ButtonLink to="/dashboard/apps/new" leftIcon={<Plus className="size-4" />}>Add application</ButtonLink> : undefined}
          />
        </Card>
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {list.map((a) => <AppTile key={a.id} app={a} active={activeByApp.get(a.id) ?? 0} />)}
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-xs text-subtle">
                <th className="px-5 py-2.5 font-medium">Application</th>
                <th className="px-3 py-2.5 font-medium">Category</th>
                <th className="px-3 py-2.5 font-medium">Platforms</th>
                <th className="px-3 py-2.5 text-right font-medium">Rating</th>
                <th className="px-3 py-2.5 text-right font-medium">Downloads</th>
                <th className="px-3 py-2.5 text-right font-medium">Active campaigns</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                  <td className="px-5 py-2.5">
                    <Link to={`/dashboard/apps/${a.id}`} className="flex items-center gap-3">
                      <AppIcon app={a} size="sm" />
                      <span><span className="block font-semibold text-fg hover:text-accent-text">{a.name}</span><span className="text-xs text-subtle">{a.developer}</span></span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-muted">{categoryBySlug[a.category].name}</td>
                  <td className="px-3 py-2.5 text-muted">{a.platforms.map((p) => (p === 'ios' ? 'iOS' : 'Android')).join(', ')}</td>
                  <td className="px-3 py-2.5 text-right"><RatingPill value={a.rating} /></td>
                  <td className="num px-3 py-2.5 text-right text-fg">{formatCompact(a.downloads)}</td>
                  <td className="num px-3 py-2.5 text-right text-fg">{activeByApp.get(a.id) ?? 0}</td>
                  <td className="px-5 py-2.5"><Badge tone={appStatusBadge[a.status].tone} dot>{appStatusBadge[a.status].label}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </PageTransition>
  )
}

function AppTile({ app, active }: { app: MobileApp; active: number }) {
  const s = appStatusBadge[app.status]
  return (
    <Link to={`/dashboard/apps/${app.id}`} className="card group flex flex-col p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <AppIcon app={app} size="md" className="transition-transform duration-300 group-hover:scale-105" />
        <Badge tone={s.tone} dot>{s.label}</Badge>
      </div>
      <h3 className="mt-3 font-display text-[15px] font-bold text-fg">{app.name}</h3>
      <p className="text-xs text-subtle">{app.developer} · {categoryBySlug[app.category].name}</p>
      <dl className="num mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-xs">
        <div><dt className="text-subtle">Rating</dt><dd className="font-semibold text-fg">★ {app.rating.toFixed(1)}</dd></div>
        <div><dt className="text-subtle">Installs</dt><dd className="font-semibold text-fg">{formatDownloads(app.downloads)}</dd></div>
        <div><dt className="text-subtle">Live camp.</dt><dd className="font-semibold text-fg">{active}</dd></div>
      </dl>
    </Link>
  )
}
