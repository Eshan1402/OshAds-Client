import { ArrowDown, ArrowUp, Building2, Eye, FileBarChart, Pencil, Plus, Search, SearchX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useDebounce } from '@/hooks/useDebounce'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { clientsService, type ClientWithStats } from '@/services/clientsService'
import type { ClientStatus } from '@/types'
import { cn } from '@/utils/cn'
import { formatCompact, formatCurrency, formatPercent } from '@/utils/format'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Input, Select } from '@/components/ui/Form'
import { ProgressBar } from '@/components/ui/Misc'
import { Menu } from '@/components/ui/Popover'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { PageTransition } from '@/components/layout/PageTransition'

export const clientStatus: Record<ClientStatus, { tone: BadgeTone; label: string }> = {
  active: { tone: 'success', label: 'Active' },
  onboarding: { tone: 'info', label: 'Onboarding' },
  paused: { tone: 'warning', label: 'Paused' },
  churned: { tone: 'neutral', label: 'Churned' },
}

export function ClientLogo({ client, size = 'md' }: { client: Pick<ClientWithStats, 'name' | 'logoColors' | 'logo'>; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'size-8 text-xs rounded-lg', md: 'size-10 text-sm rounded-xl', lg: 'size-14 text-lg rounded-2xl' }[size]
  if (client.logo) return <img src={client.logo} alt="" className={cn('shrink-0 bg-white object-cover ring-1 ring-line', s)} />
  return (
    <span className={cn('grid shrink-0 place-items-center font-display font-bold text-white', s)} style={{ background: `linear-gradient(140deg, ${client.logoColors[0]}, ${client.logoColors[1]})` }} aria-hidden>
      {client.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
    </span>
  )
}

type SortKey = 'name' | 'downloads' | 'spend' | 'conversion'

export default function ClientsPage() {
  useDocumentTitle('Clients')
  const { can } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<ClientStatus | 'all'>('all')
  const [sort, setSort] = useState<{ k: SortKey; asc: boolean }>({ k: 'spend', asc: false })
  const dq = useDebounce(q, 180)
  const { data, error, refetch } = useQuery('clients:list', () => clientsService.list())
  const rows = useMemo(() => {
    const list = data?.filter((c) => (status === 'all' || c.status === status) && (!dq || `${c.name} ${c.company} ${c.contactName}`.toLowerCase().includes(dq.toLowerCase())))
    return list?.sort((a, b) => {
      const cmp = sort.k === 'name' ? a.name.localeCompare(b.name) : a[sort.k] - b[sort.k]
      return sort.asc ? cmp : -cmp
    })
  }, [data, status, dq, sort])
  const maxConv = Math.max(1, ...(data?.map((c) => c.conversion) ?? [1]))

  const Th = ({ k, children, right }: { k: SortKey; children: React.ReactNode; right?: boolean }) => (
    <th className={cn('px-3 py-2.5 font-medium', right && 'text-right')} aria-sort={sort.k === k ? (sort.asc ? 'ascending' : 'descending') : 'none'}>
      <button onClick={() => setSort((s) => ({ k, asc: s.k === k ? !s.asc : false }))} className="inline-flex items-center gap-1 hover:text-fg">
        {children}
        {sort.k === k && (sort.asc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
      </button>
    </th>
  )

  return (
    <PageTransition>
      <PageHeader
        title="Clients"
        description="App publishers running campaigns with OshAds."
        actions={can('clients:write') && <ButtonLink to="/dashboard/clients/new" leftIcon={<Plus className="size-4" />}>Add client</ButtonLink>}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Total clients', data ? String(data.length) : '—'],
          ['Active', data ? String(data.filter((c) => c.status === 'active').length) : '—'],
          ['Lifetime spend', data ? formatCurrency(data.reduce((s, c) => s + c.spend, 0)) : '—'],
          ['Downloads delivered', data ? formatCompact(data.reduce((s, c) => s + c.downloads, 0)) : '—'],
        ].map(([k, v]) => (
          <div key={k} className="card px-4 py-3.5"><p className="text-xs text-subtle">{k}</p><p className="num mt-1 font-display text-xl font-bold text-fg">{v}</p></div>
        ))}
      </div>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-line px-4 py-3 sm:flex-row sm:px-5">
          <div className="sm:w-72"><Input inputSize="sm" leftIcon={<Search />} placeholder="Search clients or contacts" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search clients" /></div>
          <Select selectSize="sm" value={status} onChange={(e) => setStatus(e.target.value as ClientStatus | 'all')} aria-label="Status" className="sm:w-40">
            <option value="all">All statuses</option>
            {Object.entries(clientStatus).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </div>
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : !rows ? (
          <div className="space-y-2 p-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={data?.length ? <SearchX /> : <Building2 />} title={data?.length ? 'No clients match' : 'No clients yet'} description={data?.length ? 'Try a different search or status.' : 'Add your first app publisher to start running campaigns.'} action={can('clients:write') && !data?.length ? <ButtonLink to="/dashboard/clients/new">Add client</ButtonLink> : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-xs text-subtle">
                  <th className="py-2.5 pl-5 pr-3 font-medium"><button onClick={() => setSort((s) => ({ k: 'name', asc: s.k === 'name' ? !s.asc : true }))} className="hover:text-fg">Client</button></th>
                  <th className="px-3 py-2.5 font-medium">Company</th>
                  <th className="px-3 py-2.5 text-right font-medium">Apps</th>
                  <th className="px-3 py-2.5 text-right font-medium">Active camp.</th>
                  <Th k="downloads" right>Downloads</Th>
                  <Th k="spend" right>Spend</Th>
                  <Th k="conversion">Performance</Th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="w-12 px-3 py-2.5 pr-5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                    <td className="py-2.5 pl-5 pr-3">
                      <Link to={`/dashboard/clients/${c.id}`} className="flex items-center gap-3">
                        <ClientLogo client={c} size="sm" />
                        <span><span className="block font-semibold text-fg hover:text-accent-text">{c.name}</span><span className="text-xs text-subtle">{c.contactName}</span></span>
                      </Link>
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-2.5 text-muted">{c.company}</td>
                    <td className="num px-3 py-2.5 text-right text-fg">{c.appCount}</td>
                    <td className="num px-3 py-2.5 text-right text-fg">{c.activeCampaigns}</td>
                    <td className="num px-3 py-2.5 text-right text-fg">{formatCompact(c.downloads)}</td>
                    <td className="num px-3 py-2.5 text-right font-semibold text-fg">{formatCurrency(c.spend)}</td>
                    <td className="w-40 px-3 py-2.5">
                      <div className="num flex justify-between text-[11px]"><span className="text-muted">Conv.</span><span className="font-semibold text-fg">{formatPercent(c.conversion)}</span></div>
                      <ProgressBar value={c.conversion} max={maxConv} tone="success" className="mt-1" label={`Conversion ${formatPercent(c.conversion)}`} />
                    </td>
                    <td className="px-3 py-2.5"><Badge tone={clientStatus[c.status].tone} dot>{clientStatus[c.status].label}</Badge></td>
                    <td className="px-3 py-2.5 pr-5 text-right">
                      <Menu
                        label={`Actions for ${c.name}`}
                        trigger={({ toggle, open }) => <Button variant="ghost" size="xs" iconOnly onClick={toggle} aria-expanded={open} aria-label={`Actions for ${c.name}`}><span className="text-base leading-none">⋯</span></Button>}
                        items={[
                          { label: 'View client', icon: <Eye />, href: `/dashboard/clients/${c.id}` },
                          { label: 'Edit client', icon: <Pencil />, href: `/dashboard/clients/${c.id}/edit`, hidden: !can('clients:write') },
                          { label: 'Generate report', icon: <FileBarChart />, onSelect: () => navigate(`/dashboard/reports?type=client&client=${c.id}`), hidden: !can('reports:export') },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageTransition>
  )
}
