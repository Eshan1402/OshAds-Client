import { Archive, Check, ChevronRight, Copy, ExternalLink, Megaphone, Pause, Pencil, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { countryFlag, countryName } from '@/data/geo'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { ApiError } from '@/services/api'
import { appsService } from '@/services/appsService'
import { campaignMetrics, campaignsService } from '@/services/campaignsService'
import { clientsService } from '@/services/clientsService'
import { queryClient } from '@/services/queryClient'
import type { Campaign } from '@/types'
import { formatCurrency, formatCurrencyPrecise, formatDate, formatNumber, formatPercent } from '@/utils/format'
import { AppIcon } from '@/components/ui/AppIcon'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Field, Input } from '@/components/ui/Form'
import { ProgressBar } from '@/components/ui/Misc'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { useCampaignActions } from '@/components/campaigns/useCampaignActions'
import { TrafficChart } from '@/components/charts/TrafficChart'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { PageTransition } from '@/components/layout/PageTransition'

export default function CampaignDetailPage() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const { can } = useAuth()
  const { data: c, error, refetch } = useQuery(`campaigns:detail:${id}`, () => campaignsService.get(id))
  const app = useQuery(c ? `apps:detail:id:${c.appId}` : null, () => appsService.getById(c!.appId))
  const client = useQuery(c ? `clients:detail:${c.clientId}` : null, () => clientsService.get(c!.clientId))
  const actions = useCampaignActions()
  const [confirmArchive, setConfirmArchive] = useState(false)
  useDocumentTitle(c?.name ?? 'Campaign')
  const editing = params.get('edit') === '1' && can('campaigns:write')

  if (error) {
    return error instanceof ApiError && error.status === 404 ? (
      <EmptyState icon={<Megaphone />} title="Campaign not found" description={`We couldn’t find a campaign with ID ${id}. It may have been deleted.`} action={<ButtonLink to="/dashboard/campaigns">Back to campaigns</ButtonLink>} />
    ) : (
      <ErrorState title="Unable to load campaign" error={error} onRetry={refetch} />
    )
  }
  if (!c) return <DetailSkeleton />

  const m = campaignMetrics(c)
  const canWrite = can('campaigns:write')
  const elapsed = Math.min(100, Math.max(0, ((Date.now() - new Date(c.startDate).getTime()) / (new Date(c.endDate).getTime() - new Date(c.startDate).getTime())) * 100))

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow={
          <nav aria-label="Breadcrumb" className="flex items-center gap-1">
            <Link to="/dashboard/campaigns" className="hover:text-fg">Campaigns</Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span className="num">{c.id}</span>
          </nav>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            {app.data && <AppIcon app={app.data} size="md" />}
            <span>{c.name}</span>
            <StatusBadge status={c.status} />
          </span>
        }
        description={
          <>
            {client.data ? <Link to={`/dashboard/clients/${c.clientId}`} className="font-medium text-fg hover:underline">{client.data.name}</Link> : '…'} · {formatDate(c.startDate)} → {formatDate(c.endDate)} · {c.payoutModel} at {formatCurrencyPrecise(c.bid)}
          </>
        }
        actions={
          <>
            {app.data?.status === 'live' && (
              <ButtonLink to={`/app/${app.data.slug}`} target="_blank" variant="ghost" size="sm" leftIcon={<ExternalLink className="size-3.5" />}>Public page</ButtonLink>
            )}
            {canWrite && (
              <>
                {c.status === 'active' && <Button variant="outline" size="sm" leftIcon={<Pause className="size-3.5" />} onClick={() => actions.pause(c).then(refetch)} loading={actions.busy === c.id}>Pause</Button>}
                {['paused', 'draft', 'archived'].includes(c.status) && <Button variant="outline" size="sm" leftIcon={<Play className="size-3.5" />} onClick={() => actions.resume(c).then(refetch)} loading={actions.busy === c.id}>{c.status === 'draft' ? 'Launch' : c.status === 'archived' ? 'Restore' : 'Resume'}</Button>}
                <Button variant="outline" size="sm" leftIcon={<Pencil className="size-3.5" />} onClick={() => setParams({ edit: '1' })}>Edit</Button>
                {c.status !== 'archived' && <Button variant="ghost" size="sm" iconOnly aria-label="Archive campaign" onClick={() => setConfirmArchive(true)}><Archive className="size-4" /></Button>}
              </>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          ['Impressions', formatNumber(c.impressions)],
          ['Clicks', formatNumber(c.clicks)],
          ['Downloads', formatNumber(c.downloads)],
          ['CTR', formatPercent(m.ctr)],
          ['Conversion', formatPercent(m.conversion)],
          ['eCPI', m.ecpi ? formatCurrencyPrecise(m.ecpi) : '—'],
        ].map(([k, v]) => (
          <div key={k} className="card p-4">
            <p className="text-xs text-subtle">{k}</p>
            <p className="num mt-1.5 font-display text-xl font-bold text-fg">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div id="performance">
          <TrafficChart scope={{ type: 'campaign', id: c.id }} title="Campaign performance" initialRange="90d" />
        </div>
        <Card>
          <CardHeader title="Budget & pacing" />
          <CardBody className="space-y-5">
            <Meter label="Budget used" value={`${formatCurrency(c.spent)} of ${formatCurrency(c.budget)}`} pct={m.utilization} tone={m.utilization > 90 ? 'warning' : 'accent'} />
            <Meter label="Install target" value={`${formatNumber(c.downloads)} of ${formatNumber(c.targetInstalls)}`} pct={m.targetProgress} tone="success" />
            <Meter label="Flight elapsed" value={`${Math.round(elapsed)}%`} pct={elapsed} tone="iris" />
            <dl className="grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
              <div><dt className="text-xs text-subtle">Daily cap</dt><dd className="num font-semibold text-fg">{formatCurrency(c.dailyCap)}</dd></div>
              <div><dt className="text-xs text-subtle">Revenue</dt><dd className="num font-semibold text-fg">{formatCurrency(c.revenue)}</dd></div>
              <div><dt className="text-xs text-subtle">Objective</dt><dd className="font-semibold capitalize text-fg">{c.objective}</dd></div>
              <div><dt className="text-xs text-subtle">Margin</dt><dd className="num font-semibold text-success">{c.revenue ? formatPercent(((c.revenue - c.spent) / c.revenue) * 100) : '—'}</dd></div>
            </dl>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Targeting" />
          <CardBody className="space-y-4 text-sm">
            <div>
              <p className="eyebrow mb-2">Countries</p>
              <div className="flex flex-wrap gap-1.5">
                {c.targeting.countries.map((code) => <span key={code} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-fg">{countryFlag(code)} {countryName(code)}</span>)}
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              <div><dt className="text-xs text-subtle">Platforms</dt><dd className="text-fg">{c.targeting.platforms.map((p) => (p === 'ios' ? 'iOS' : 'Android')).join(', ')}</dd></div>
              <div><dt className="text-xs text-subtle">Devices</dt><dd className="capitalize text-fg">{c.targeting.devices.join(', ')}</dd></div>
              <div><dt className="text-xs text-subtle">Age</dt><dd className="text-fg">{c.targeting.ageRange[0]}–{c.targeting.ageRange[1]}</dd></div>
              <div><dt className="text-xs text-subtle">Sources</dt><dd className="text-fg">{c.sources.length} channels</dd></div>
            </dl>
            {c.targeting.interests.length > 0 && (
              <div>
                <p className="eyebrow mb-2">Interests</p>
                <p className="text-fg">{c.targeting.interests.join(', ')}</p>
              </div>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Tracking" description={`${c.tracking.attributionPartner} · ${c.tracking.attributionWindowDays}-day window`} />
          <CardBody className="space-y-3">
            <CopyField label="Tracking URL" value={c.tracking.trackingUrl} />
            <CopyField label="Postback URL" value={c.tracking.postbackUrl} />
            <div className="flex gap-4 text-xs text-subtle">
              <span>utm_source=<span className="font-mono text-fg">{c.tracking.utmSource}</span></span>
              <span>utm_campaign=<span className="font-mono text-fg">{c.tracking.utmCampaign}</span></span>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Creatives" description="Screens used on the public listing" />
          <CardBody>
            {!app.data ? (
              <Skeleton className="h-48" />
            ) : app.data.screenshotImages?.length ? (
              <div className="flex gap-3 overflow-x-auto scrollbar-none" tabIndex={0} role="region" aria-label="Campaign creatives">
                {app.data.screenshotImages.map((src, i) => (
                  <img key={i} src={src} alt={`${app.data!.name} screen ${i + 1}`} className="h-48 w-auto shrink-0 rounded-xl border border-line object-cover" />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm text-muted">
                <AppIcon app={app.data} size="md" />
                No screens uploaded yet. Add them from the app’s edit page.
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {c.notes && (
        <Card>
          <CardHeader title="Notes" />
          <CardBody><p className="text-sm text-muted">{c.notes}</p></CardBody>
        </Card>
      )}

      {editing && <EditCampaignModal campaign={c} onClose={() => setParams({})} onSaved={refetch} />}
      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title="Archive this campaign?"
        description="It will stop serving immediately. Reporting data is kept and you can restore it later."
        confirmLabel="Archive campaign"
        onConfirm={() => {
          setConfirmArchive(false)
          actions.archive(c).then(refetch)
        }}
      />
    </PageTransition>
  )
}

function Meter({ label, value, pct, tone }: { label: string; value: string; pct: number; tone: 'accent' | 'success' | 'warning' | 'iris' }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
        <span className="text-muted">{label}</span>
        <span className="num font-semibold text-fg">{Math.round(pct)}%</span>
      </div>
      <ProgressBar value={pct} tone={tone} className="h-2" label={label} />
      <p className="num mt-1 text-xs text-subtle">{value}</p>
    </div>
  )
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(t)
  }, [copied])
  return (
    <div>
      <p className="mb-1 text-xs text-subtle">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 p-1.5 pl-2.5">
        <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-fg" title={value}>{value}</code>
        <button
          onClick={() => navigator.clipboard?.writeText(value).then(() => setCopied(true))}
          className="grid size-7 shrink-0 place-items-center rounded-md text-subtle transition hover:bg-surface hover:text-fg"
          aria-label={copied ? 'Copied' : `Copy ${label}`}
        >
          {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
        </button>
      </div>
    </div>
  )
}

function EditCampaignModal({ campaign, onClose, onSaved }: { campaign: Campaign; onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const [name, setName] = useState(campaign.name)
  const [budget, setBudget] = useState(campaign.budget)
  const [dailyCap, setDailyCap] = useState(campaign.dailyCap)
  const [bid, setBid] = useState(campaign.bid)
  const [endDate, setEndDate] = useState(campaign.endDate)
  const [saving, setSaving] = useState(false)
  const errors = {
    name: name.trim().length < 4 ? 'Name is too short.' : undefined,
    budget: budget < campaign.spent ? `Budget can’t be below amount already spent (${formatCurrency(campaign.spent)}).` : undefined,
    dailyCap: dailyCap <= 0 || dailyCap > budget ? 'Daily cap must be positive and within budget.' : undefined,
    endDate: endDate <= campaign.startDate ? 'End date must be after the start date.' : undefined,
  }
  const invalid = Object.values(errors).some(Boolean)
  const save = async () => {
    if (invalid) return
    setSaving(true)
    try {
      await campaignsService.update(campaign.id, { name: name.trim(), budget, dailyCap, bid, endDate })
      queryClient.invalidate('campaigns')
      toast({ tone: 'success', title: 'Campaign updated', description: name })
      onSaved()
      onClose()
    } catch (e) {
      toast({ tone: 'error', title: 'Couldn’t save changes', description: (e as Error).message })
      setSaving(false)
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="Edit campaign"
      description={campaign.id}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={invalid}>Save changes</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors.name} className="sm:col-span-2">{({ id, invalid: inv }) => <Input id={id} invalid={inv} value={name} onChange={(e) => setName(e.target.value)} data-autofocus />}</Field>
        <Field label="Total budget" error={errors.budget}>{({ id, invalid: inv }) => <Input id={id} invalid={inv} type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} leftIcon={<span className="text-xs font-semibold">$</span>} />}</Field>
        <Field label="Daily cap" error={errors.dailyCap}>{({ id, invalid: inv }) => <Input id={id} invalid={inv} type="number" value={dailyCap} onChange={(e) => setDailyCap(Number(e.target.value))} leftIcon={<span className="text-xs font-semibold">$</span>} />}</Field>
        <Field label={`Bid (${campaign.payoutModel})`}>{({ id }) => <Input id={id} type="number" step={0.05} value={bid} onChange={(e) => setBid(Number(e.target.value))} leftIcon={<span className="text-xs font-semibold">$</span>} />}</Field>
        <Field label="End date" error={errors.endDate}>{({ id, invalid: inv }) => <Input id={id} invalid={inv} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />}</Field>
      </div>
    </Modal>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-9 w-2/3" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      <Skeleton className="h-[380px]" />
    </div>
  )
}
