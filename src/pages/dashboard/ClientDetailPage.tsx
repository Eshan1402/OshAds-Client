import { Building2, ChevronRight, FileBarChart, Mail, Pencil, Plus } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { users } from '@/data/users'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { ApiError } from '@/services/api'
import { appsService } from '@/services/appsService'
import { clientsService } from '@/services/clientsService'
import { formatCompact, formatCurrency, formatDate, formatPercent } from '@/utils/format'
import { AppIcon } from '@/components/ui/AppIcon'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Avatar } from '@/components/ui/Misc'
import { RatingPill } from '@/components/ui/Rating'
import { CampaignTable } from '@/components/campaigns/CampaignTable'
import { TrafficChart } from '@/components/charts/TrafficChart'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { PageTransition } from '@/components/layout/PageTransition'
import { appStatusBadge } from './AppsPage'
import { ClientLogo, clientStatus } from './ClientsPage'

export default function ClientDetailPage() {
  const { id = '' } = useParams()
  const { can } = useAuth()
  const { data: c, error, refetch } = useQuery(`clients:detail:${id}`, () => clientsService.get(id))
  const apps = useQuery('apps:all:admin', () => appsService.list({ includeHidden: true }))
  useDocumentTitle(c?.name ?? 'Client')

  if (error) {
    return error instanceof ApiError && error.status === 404 ? (
      <EmptyState icon={<Building2 />} title="Client not found" description="This client may have been removed." action={<ButtonLink to="/dashboard/clients">Back to clients</ButtonLink>} />
    ) : <ErrorState error={error} onRetry={refetch} />
  }
  if (!c) return <Skeleton className="h-[600px]" />

  const clientApps = apps.data?.filter((a) => a.clientId === c.id)
  const am = users.find((u) => u.id === c.accountManagerId)

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow={<nav aria-label="Breadcrumb" className="flex items-center gap-1"><Link to="/dashboard/clients" className="hover:text-fg">Clients</Link><ChevronRight className="size-3.5" aria-hidden /><span>{c.name}</span></nav>}
        title={<span className="flex flex-wrap items-center gap-3"><ClientLogo client={c} />{c.name}<Badge tone={clientStatus[c.status].tone} dot>{clientStatus[c.status].label}</Badge></span>}
        description={`${c.company} · ${c.industry} · ${c.country} · Client since ${formatDate(c.since)}`}
        actions={
          <>
            {can('reports:export') && <ButtonLink to={`/dashboard/reports?type=client&client=${c.id}`} variant="outline" size="sm" leftIcon={<FileBarChart className="size-3.5" />}>Report</ButtonLink>}
            {can('clients:write') && <ButtonLink to={`/dashboard/clients/${c.id}/edit`} variant="outline" size="sm" leftIcon={<Pencil className="size-3.5" />}>Edit</ButtonLink>}
            {can('campaigns:write') && <ButtonLink to={`/dashboard/campaigns/new?client=${c.id}`} size="sm" leftIcon={<Plus className="size-3.5" />}>New campaign</ButtonLink>}
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Applications', String(c.appCount)],
          ['Active campaigns', `${c.activeCampaigns} / ${c.totalCampaigns}`],
          ['Downloads', formatCompact(c.downloads)],
          ['Spend', formatCurrency(c.spend)],
          ['Conversion', formatPercent(c.conversion)],
        ].map(([k, v]) => (
          <div key={k} className="card p-4"><p className="text-xs text-subtle">{k}</p><p className="num mt-1.5 font-display text-xl font-bold text-fg">{v}</p></div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <TrafficChart scope={{ type: 'client', id: c.id }} title="Client traffic & downloads" />
        <div className="space-y-6">
          <Card>
            <CardHeader title="Account" />
            <CardBody className="space-y-4 text-[13px]">
              <div>
                <p className="text-xs text-subtle">Primary contact</p>
                <p className="font-semibold text-fg">{c.contactName}</p>
                <a href={`mailto:${c.contactEmail}`} className="inline-flex items-center gap-1 text-accent-text hover:underline"><Mail className="size-3.5" /> {c.contactEmail}</a>
              </div>
              {am && (
                <div className="flex items-center gap-3 border-t border-line pt-4">
                  <Avatar name={am.name} color={am.avatarColor} size="sm" />
                  <div><p className="text-xs text-subtle">Account manager</p><p className="font-semibold text-fg">{am.name}</p></div>
                </div>
              )}
              <div className="border-t border-line pt-4"><p className="text-xs text-subtle">Tier</p><p className="font-semibold text-fg">{c.tier}</p></div>
            </CardBody>
          </Card>
        </div>
      </div>
      <Card>
        <CardHeader title="Applications" action={can('apps:write') && <ButtonLink to="/dashboard/apps/new" variant="ghost" size="sm" leftIcon={<Plus className="size-3.5" />}>Add app</ButtonLink>} />
        <CardBody>
          {!clientApps ? <Skeleton className="h-20" /> : clientApps.length === 0 ? (
            <EmptyState compact icon={<Building2 />} title="No applications yet" description="Add this client’s first app to start a campaign." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {clientApps.map((a) => (
                <Link key={a.id} to={`/dashboard/apps/${a.id}`} className="flex items-center gap-3 rounded-xl border border-line p-3 transition hover:bg-surface-2">
                  <AppIcon app={a} size="md" />
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-fg">{a.name}</span><span className="block truncate text-xs text-subtle">{a.tagline}</span></span>
                  <span className="flex flex-col items-end gap-1"><RatingPill value={a.rating} /><Badge tone={appStatusBadge[a.status].tone}>{appStatusBadge[a.status].label}</Badge></span>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader title="Campaigns" className="pb-4" />
        <div className="border-t border-line"><CampaignTable clientId={c.id} compact pageSize={8} /></div>
      </Card>
    </PageTransition>
  )
}
