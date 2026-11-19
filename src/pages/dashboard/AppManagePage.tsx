import { AppWindow, ChevronRight, ExternalLink, Pencil, Plus } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { categoryBySlug } from '@/data/categories'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { ApiError } from '@/services/api'
import { appsService } from '@/services/appsService'
import { campaignsService } from '@/services/campaignsService'
import { formatCompact, formatDate, formatNumber, formatPercent } from '@/utils/format'
import { AppIcon } from '@/components/ui/AppIcon'
import { ButtonLink } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DynamicIcon } from '@/components/ui/DynamicIcon'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Stars } from '@/components/ui/Rating'
import { CampaignTable } from '@/components/campaigns/CampaignTable'
import { TrafficChart } from '@/components/charts/TrafficChart'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { PageTransition } from '@/components/layout/PageTransition'
import { campaignRunning } from '@/lib/recommend'

export default function AppManagePage() {
  const { id = '' } = useParams()
  const { can } = useAuth()
  const { data: app, error, refetch } = useQuery(`apps:detail:id:${id}`, () => appsService.getById(id))
  const camps = useQuery(`campaigns:list:app:${id}`, () => campaignsService.list({ appId: id }))
  useDocumentTitle(app?.name ?? 'Application')

  if (error) {
    return error instanceof ApiError && error.status === 404 ? (
      <EmptyState icon={<AppWindow />} title="Application not found" description="This app may have been removed." action={<ButtonLink to="/dashboard/apps">Back to applications</ButtonLink>} />
    ) : <ErrorState error={error} onRetry={refetch} />
  }
  if (!app) return <Skeleton className="h-[600px]" />

  const totals = camps.data?.reduce((acc, c) => ({ clicks: acc.clicks + c.clicks, downloads: acc.downloads + c.downloads, spent: acc.spent + c.spent }), { clicks: 0, downloads: 0, spent: 0 })

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow={<nav aria-label="Breadcrumb" className="flex items-center gap-1"><Link to="/dashboard/apps" className="hover:text-fg">Applications</Link><ChevronRight className="size-3.5" aria-hidden /><span>{app.name}</span></nav>}
        title={<span className="flex flex-wrap items-center gap-3"><AppIcon app={app} size="md" />{app.name}</span>}
        description={<>{app.tagline} · <Link to={`/dashboard/clients/${app.clientId}`} className="font-medium text-fg hover:underline">{app.developer}</Link></>}
        actions={
          <>
            {app.status === 'live' && <ButtonLink to={`/app/${app.slug}`} target="_blank" variant="ghost" size="sm" leftIcon={<ExternalLink className="size-3.5" />}>Public page</ButtonLink>}
            {can('apps:write') && <ButtonLink to={`/dashboard/apps/${app.id}/edit`} variant="outline" size="sm" leftIcon={<Pencil className="size-3.5" />}>Edit</ButtonLink>}
            {can('campaigns:write') && <ButtonLink to={`/dashboard/campaigns/new?client=${app.clientId}&app=${app.id}`} size="sm" leftIcon={<Plus className="size-3.5" />}>New campaign</ButtonLink>}
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Attributed downloads', totals ? formatNumber(totals.downloads) : '—'],
          ['Clicks', totals ? formatNumber(totals.clicks) : '—'],
          ['Conversion', totals?.clicks ? formatPercent((totals.downloads / totals.clicks) * 100) : '—'],
          ['Live campaigns', camps.data ? String(camps.data.filter((c) => campaignRunning(c)).length) : '—'],
        ].map(([k, v]) => (
          <div key={k} className="card p-4"><p className="text-xs text-subtle">{k}</p><p className="num mt-1.5 font-display text-xl font-bold text-fg">{v}</p></div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <TrafficChart scope={{ type: 'app', id: app.id }} title="App performance" />
        <Card>
          <CardHeader title="Listing" />
          <CardBody className="space-y-4">
            <div className="grid place-items-center rounded-xl bg-surface-2 py-6"><AppIcon app={app} size="xl" /></div>
            <dl className="space-y-2 text-[13px]">
              <Row k="Category" v={categoryBySlug[app.category].name} />
              <Row k="Rating" v={<span className="inline-flex items-center gap-1.5"><Stars value={app.rating} size={11} /> {app.rating.toFixed(1)}</span>} />
              <Row k="Store downloads" v={formatCompact(app.downloads)} />
              <Row k="Platforms" v={app.platforms.map((p) => (p === 'ios' ? 'iOS' : 'Android')).join(', ')} />
              <Row k="Updated" v={formatDate(app.updatedAt)} />
            </dl>
          </CardBody>
        </Card>
      </div>
      <Card>
        <CardHeader title="Key features" />
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {app.features.map((f) => (
            <div key={f.title} className="rounded-xl border border-line p-3.5">
              <DynamicIcon name={f.icon} className="size-4 text-accent-text" />
              <p className="mt-2 text-sm font-semibold text-fg">{f.title}</p>
              <p className="text-xs text-muted">{f.description}</p>
            </div>
          ))}
        </CardBody>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader title="Campaigns" description={`Campaigns promoting ${app.name}`} className="pb-4" />
        <div className="border-t border-line"><CampaignTable appId={app.id} compact pageSize={8} /></div>
      </Card>
    </PageTransition>
  )
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-3"><dt className="text-subtle">{k}</dt><dd className="num text-right font-medium text-fg">{v}</dd></div>
}
