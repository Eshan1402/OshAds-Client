import { ArrowDown, ArrowUp, ArrowUpDown, Archive, BarChart3, Columns3, Eye, Megaphone, Pause, Pencil, Play, Plus, Search, SearchX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useDebounce } from '@/hooks/useDebounce'
import { useQuery } from '@/hooks/useQuery'
import { appsService } from '@/services/appsService'
import { campaignMetrics, campaignsService } from '@/services/campaignsService'
import { clientsService } from '@/services/clientsService'
import type { Campaign, CampaignStatus } from '@/types'
import { cn } from '@/utils/cn'
import { formatCompact, formatCurrency, formatNumber, formatPercent } from '@/utils/format'
import { AppIcon } from '@/components/ui/AppIcon'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Checkbox, Input, Select } from '@/components/ui/Form'
import { Pagination, ProgressBar } from '@/components/ui/Misc'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Menu, Popover } from '@/components/ui/Popover'
import { useCampaignActions } from './useCampaignActions'

type ColKey = 'client' | 'app' | 'impressions' | 'clicks' | 'downloads' | 'ctr' | 'conversion' | 'budget' | 'status'
type SortKey = 'name' | 'impressions' | 'clicks' | 'downloads' | 'ctr' | 'conversion' | 'budget'

const columnLabels: Record<ColKey, string> = {
  client: 'Client',
  app: 'App',
  impressions: 'Impressions',
  clicks: 'Clicks',
  downloads: 'Downloads',
  ctr: 'CTR',
  conversion: 'Conversion',
  budget: 'Budget',
  status: 'Status',
}

export interface CampaignTableProps {
  status?: CampaignStatus | 'all'
  clientId?: string
  appId?: string
  compact?: boolean
  pageSize?: number
  title?: string
  showStatusFilter?: boolean
  initialQuery?: string
}

export function CampaignTable({ status: fixedStatus, clientId, appId, compact, pageSize = 10, showStatusFilter = true, initialQuery }: CampaignTableProps) {
  const { can } = useAuth()
  const navigate = useNavigate()
  const actions = useCampaignActions()
  const [q, setQ] = useState(initialQuery ?? '')
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>(fixedStatus ?? 'all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'downloads', dir: 'desc' })
  const [page, setPage] = useState(1)
  const [hidden, setHidden] = useState<Set<ColKey>>(() => new Set(compact ? ['impressions', 'client'] : []))
  const [archiveTarget, setArchiveTarget] = useState<Campaign | null>(null)
  const debouncedQ = useDebounce(q, 180)
  const status = fixedStatus ?? statusFilter

  const key = `campaigns:list:${status}:${clientId ?? ''}:${appId ?? ''}:${debouncedQ}`
  const { data, error, refetch, loading } = useQuery(key, () => campaignsService.list({ status, clientId, appId, q: debouncedQ }), { keepPrevious: true })
  const apps = useQuery('apps:all:admin', () => appsService.list({ includeHidden: true }))
  const clients = useQuery('clients:list', () => clientsService.list())
  const appById = useMemo(() => new Map(apps.data?.map((a) => [a.id, a])), [apps.data])
  const clientById = useMemo(() => new Map(clients.data?.map((c) => [c.id, c])), [clients.data])

  const sorted = useMemo(() => {
    if (!data) return []
    const val = (c: Campaign): number | string => {
      const m = campaignMetrics(c)
      switch (sort.key) {
        case 'name': return c.name
        case 'ctr': return m.ctr
        case 'conversion': return m.conversion
        case 'budget': return c.budget
        default: return c[sort.key]
      }
    }
    return [...data].sort((a, b) => {
      const va = val(a)
      const vb = val(b)
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : va - (vb as number)
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [data, sort])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, pageCount)
  const rows = sorted.slice((current - 1) * pageSize, current * pageSize)
  const show = (c: ColKey) => !hidden.has(c)

  const toggleSort = (k: SortKey) => {
    setSort((s) => (s.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'desc' }))
    setPage(1)
  }

  const SortTh = ({ k, children, className }: { k: SortKey; children: React.ReactNode; className?: string }) => {
    const active = sort.key === k
    const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
    return (
      <th className={cn('px-3 py-2.5 font-medium', className)} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button onClick={() => toggleSort(k)} className={cn('inline-flex items-center gap-1 transition-colors hover:text-fg', active && 'text-fg')}>
          {children}
          <Icon className={cn('size-3', !active && 'opacity-40')} aria-hidden />
        </button>
      </th>
    )
  }

  const canWrite = can('campaigns:write')

  return (
    <div>
      {!compact && (
        <div className="flex flex-col gap-2 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:px-5">
          <div className="sm:w-72">
            <Input inputSize="sm" leftIcon={<Search />} placeholder="Search campaigns or ID" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} aria-label="Search campaigns" />
          </div>
          {showStatusFilter && !fixedStatus && (
            <Select selectSize="sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as CampaignStatus | 'all'); setPage(1) }} aria-label="Filter by status" className="sm:w-40">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </Select>
          )}
          <div className="flex items-center gap-2 sm:ml-auto">
            <Popover
              trigger={({ toggle, open, id }) => (
                <Button variant="outline" size="sm" onClick={toggle} aria-expanded={open} aria-controls={id} leftIcon={<Columns3 className="size-3.5" />}>
                  Columns
                </Button>
              )}
              panelClassName="w-52 p-2"
            >
              <p className="eyebrow px-1.5 pb-2 pt-1">Visible columns</p>
              <div className="space-y-2 px-1.5 pb-1">
                {(Object.keys(columnLabels) as ColKey[]).map((c) => (
                  <Checkbox
                    key={c}
                    checked={show(c)}
                    onChange={(v) => setHidden((h) => { const n = new Set(h); if (v) n.delete(c); else n.add(c); return n })}
                    label={<span className="text-[13px] font-normal">{columnLabels[c]}</span>}
                  />
                ))}
              </div>
            </Popover>
          </div>
        </div>
      )}

      {error ? (
        <ErrorState title="Unable to load campaigns" error={error} onRetry={refetch} />
      ) : data && data.length === 0 ? (
        <EmptyState
          icon={debouncedQ ? <SearchX /> : <Megaphone />}
          title={debouncedQ ? 'No campaigns match your search' : status === 'active' ? 'No active campaigns' : 'No campaigns yet'}
          description={debouncedQ ? 'Try a different name or campaign ID.' : 'Launch a campaign to start driving owned traffic and installs to a client app.'}
          action={canWrite && !debouncedQ ? <ButtonLink to="/dashboard/campaigns/new" leftIcon={<Plus className="size-4" />}>Create campaign</ButtonLink> : undefined}
        />
      ) : (
        <div className={cn('overflow-x-auto transition-opacity', loading && data && 'opacity-60')}>
          <table className="w-full min-w-[920px] text-[13px]">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="border-b border-line text-left text-xs text-subtle">
                <SortTh k="name" className="pl-4 sm:pl-5">Campaign</SortTh>
                {show('client') && <th className="px-3 py-2.5 font-medium">Client</th>}
                {show('app') && <th className="px-3 py-2.5 font-medium">App</th>}
                {show('impressions') && <SortTh k="impressions" className="text-right">Impr.</SortTh>}
                {show('clicks') && <SortTh k="clicks" className="text-right">Clicks</SortTh>}
                {show('downloads') && <SortTh k="downloads" className="text-right">Downloads</SortTh>}
                {show('ctr') && <SortTh k="ctr" className="text-right">CTR</SortTh>}
                {show('conversion') && <SortTh k="conversion" className="text-right">Conv.</SortTh>}
                {show('budget') && <SortTh k="budget">Budget</SortTh>}
                {show('status') && <th className="px-3 py-2.5 font-medium">Status</th>}
                <th className="w-12 px-3 py-2.5 pr-4"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {!data
                ? Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => (
                    <tr key={i} className="border-b border-line">
                      <td colSpan={11} className="px-5 py-3"><Skeleton className="h-8" /></td>
                    </tr>
                  ))
                : rows.map((c) => {
                    const m = campaignMetrics(c)
                    const app = appById.get(c.appId)
                    const client = clientById.get(c.clientId)
                    return (
                      <tr
                        key={c.id}
                        className="group cursor-pointer border-b border-line transition-colors last:border-b-0 hover:bg-surface-2/60"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('button,a')) return
                          navigate(`/dashboard/campaigns/${c.id}`)
                        }}
                      >
                        <td className="max-w-[280px] py-2.5 pl-4 pr-3 sm:pl-5">
                          <Link to={`/dashboard/campaigns/${c.id}`} className="block truncate font-semibold text-fg hover:text-accent-text">
                            {c.name.split(' — ')[1] ?? c.name}
                          </Link>
                          <span className="num text-[11px] text-subtle">{c.id} · {c.payoutModel}</span>
                        </td>
                        {show('client') && <td className="whitespace-nowrap px-3 py-2.5 text-muted">{client ? <Link to={`/dashboard/clients/${client.id}`} className="hover:text-fg hover:underline">{client.name}</Link> : '—'}</td>}
                        {show('app') && (
                          <td className="px-3 py-2.5">
                            {app ? (
                              <Link to={`/dashboard/apps/${app.id}`} className="flex items-center gap-2 whitespace-nowrap text-fg hover:underline">
                                <AppIcon app={app} size="xs" /> {app.name}
                              </Link>
                            ) : '—'}
                          </td>
                        )}
                        {show('impressions') && <td className="num px-3 py-2.5 text-right text-muted">{formatCompact(c.impressions)}</td>}
                        {show('clicks') && <td className="num px-3 py-2.5 text-right text-muted">{formatNumber(c.clicks)}</td>}
                        {show('downloads') && <td className="num px-3 py-2.5 text-right font-semibold text-fg">{formatNumber(c.downloads)}</td>}
                        {show('ctr') && <td className="num px-3 py-2.5 text-right text-muted">{formatPercent(m.ctr)}</td>}
                        {show('conversion') && <td className="num px-3 py-2.5 text-right text-muted">{formatPercent(m.conversion)}</td>}
                        {show('budget') && (
                          <td className="min-w-36 px-3 py-2.5">
                            <div className="num flex justify-between text-[11px]">
                              <span className="font-medium text-fg">{formatCurrency(c.spent)}</span>
                              <span className="text-subtle">/ {formatCompact(c.budget)}</span>
                            </div>
                            <ProgressBar value={m.utilization} tone={m.utilization > 90 ? 'warning' : 'accent'} className="mt-1" label={`${Math.round(m.utilization)}% of budget used`} />
                          </td>
                        )}
                        {show('status') && <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>}
                        <td className="px-3 py-2.5 pr-4 text-right">
                          <Menu
                            label={`Actions for ${c.name}`}
                            trigger={({ toggle, open }) => (
                              <Button variant="ghost" size="xs" iconOnly onClick={toggle} aria-expanded={open} aria-label={`Actions for ${c.name}`} loading={actions.busy === c.id}>
                                <span className="text-base leading-none">⋯</span>
                              </Button>
                            )}
                            items={[
                              { label: 'View details', icon: <Eye />, href: `/dashboard/campaigns/${c.id}` },
                              { label: 'View analytics', icon: <BarChart3 />, href: `/dashboard/campaigns/${c.id}#performance` },
                              { label: 'Edit campaign', icon: <Pencil />, href: `/dashboard/campaigns/${c.id}?edit=1`, hidden: !canWrite },
                              { label: 'Pause', icon: <Pause />, onSelect: () => actions.pause(c), hidden: !canWrite || c.status !== 'active' },
                              { label: c.status === 'archived' ? 'Restore' : 'Resume', icon: <Play />, onSelect: () => actions.resume(c), hidden: !canWrite || !['paused', 'archived', 'draft'].includes(c.status) },
                              { label: 'Archive', icon: <Archive />, onSelect: () => setArchiveTarget(c), danger: true, separatorBefore: true, hidden: !canWrite || c.status === 'archived' },
                            ]}
                          />
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>
      )}

      {data && data.length > pageSize && (
        <div className="border-t border-line px-4 py-3 sm:px-5">
          <Pagination page={current} pageCount={pageCount} onChange={setPage} total={sorted.length} pageSize={pageSize} />
        </div>
      )}

      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        title="Archive this campaign?"
        description={<>“{archiveTarget?.name}” will stop serving immediately and move to the archive. Reporting data is kept and you can restore it later.</>}
        confirmLabel="Archive campaign"
        onConfirm={() => {
          if (archiveTarget) actions.archive(archiveTarget)
          setArchiveTarget(null)
        }}
      />
    </div>
  )
}
