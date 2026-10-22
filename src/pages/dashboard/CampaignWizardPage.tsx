import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Rocket, Save, Search } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { countryFlag, countryName, countryOptions } from '@/data/geo'
import { categoryBySlug } from '@/data/categories'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { appsService } from '@/services/appsService'
import { campaignsService, type CampaignInput } from '@/services/campaignsService'
import { clientsService } from '@/services/clientsService'
import { queryClient } from '@/services/queryClient'
import type { Campaign, CampaignTracking, PayoutModel, Platform } from '@/types'
import { cn } from '@/utils/cn'
import { addDays, formatCurrency, formatCurrencyPrecise, formatDate, formatNumber, toISODate } from '@/utils/format'
import { AppIcon } from '@/components/ui/AppIcon'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Form'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { PageHeader } from '@/components/layout/DashboardLayout'

interface FormState {
  name: string
  objective: Campaign['objective']
  notes: string
  clientId: string
  appId: string
  countries: string[]
  platforms: Platform[]
  ageMin: number
  ageMax: number
  devices: Array<'phone' | 'tablet'>
  interests: string
  budget: number
  payoutModel: PayoutModel
  bid: number
  dailyCap: number
  startDate: string
  endDate: string
  attributionPartner: CampaignTracking['attributionPartner']
  trackingUrl: string
  postbackUrl: string
  utmSource: string
  utmCampaign: string
  attributionWindowDays: number
}

const steps = [
  { key: 'details', title: 'Campaign details', hint: 'Name & objective' },
  { key: 'client', title: 'Select client', hint: 'Who it’s for' },
  { key: 'app', title: 'Select app', hint: 'What we promote' },
  { key: 'audience', title: 'Target audience', hint: 'Where & who' },
  { key: 'budget', title: 'Budget & schedule', hint: 'Spend & dates' },
  { key: 'tracking', title: 'Tracking', hint: 'Attribution' },
  { key: 'review', title: 'Review & launch', hint: 'Final check' },
] as const

const today = toISODate(new Date())

const initial: FormState = {
  name: '',
  objective: 'installs',
  notes: '',
  clientId: '',
  appId: '',
  countries: ['US'],
  platforms: ['ios', 'android'],
  ageMin: 18,
  ageMax: 44,
  devices: ['phone'],
  interests: '',
  budget: 12_000,
  payoutModel: 'CPI',
  bid: 1.4,
  dailyCap: 450,
  startDate: today,
  endDate: toISODate(addDays(new Date(), 30)),
  attributionPartner: 'AppsFlyer',
  trackingUrl: '',
  postbackUrl: 'https://pb.oshads.com/v2/postback?cid={cid}&click_id={click_id}&event={event}',
  utmSource: 'oshads',
  utmCampaign: '',
  attributionWindowDays: 7,
}

type Errors = Partial<Record<keyof FormState, string>>

function validate(step: number, f: FormState): Errors {
  const e: Errors = {}
  if (step === 0) {
    if (f.name.trim().length < 4) e.name = 'Give the campaign a descriptive name (4+ characters).'
  }
  if (step === 1 && !f.clientId) e.clientId = 'Select the client this campaign is for.'
  if (step === 2 && !f.appId) e.appId = 'Select the application to promote.'
  if (step === 3) {
    if (!f.countries.length) e.countries = 'Choose at least one country.'
    if (!f.platforms.length) e.platforms = 'Choose at least one platform.'
    if (f.ageMin < 13 || f.ageMax > 99 || f.ageMin >= f.ageMax) e.ageMin = 'Enter a valid age range between 13 and 99.'
    if (!f.devices.length) e.devices = 'Choose at least one device type.'
  }
  if (step === 4) {
    if (!(f.budget >= 1000)) e.budget = 'Minimum campaign budget is $1,000.'
    if (!(f.bid > 0)) e.bid = 'Bid must be greater than $0.'
    if (!(f.dailyCap > 0)) e.dailyCap = 'Set a daily spend cap.'
    else if (f.dailyCap > f.budget) e.dailyCap = 'Daily cap can’t exceed the total budget.'
    if (!f.startDate) e.startDate = 'Choose a start date.'
    if (!f.endDate || f.endDate <= f.startDate) e.endDate = 'End date must be after the start date.'
  }
  if (step === 5) {
    if (!/^https:\/\/.+/.test(f.trackingUrl)) e.trackingUrl = 'Tracking URL must start with https://'
    if (!/^https:\/\/.+/.test(f.postbackUrl)) e.postbackUrl = 'Postback URL must start with https://'
    if (!f.utmCampaign.trim()) e.utmCampaign = 'Add a utm_campaign value.'
  }
  return e
}

export default function CampaignWizardPage() {
  useDocumentTitle('New campaign')
  const { session } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [maxReached, setMaxReached] = useState(0)
  const [f, setF] = useState<FormState>(() => ({ ...initial, clientId: params.get('client') ?? '', appId: params.get('app') ?? '' }))
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState<'launch' | 'draft' | null>(null)

  const clients = useQuery('clients:list', () => clientsService.list())
  const apps = useQuery('apps:all:admin', () => appsService.list({ includeHidden: true }))
  const app = apps.data?.find((a) => a.id === f.appId)
  const client = clients.data?.find((c) => c.id === f.clientId)

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setF((prev) => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const go = (to: number) => {
    if (to > step) {
      for (let s = step; s < to; s++) {
        const e = validate(s, f)
        if (Object.keys(e).length) {
          setErrors(e)
          setStep(s)
          return
        }
      }
    }
    setErrors({})
    setDir(to > step ? 1 : -1)
    setStep(to)
    setMaxReached((m) => Math.max(m, to))
  }

  const selectApp = (id: string) => {
    const a = apps.data?.find((x) => x.id === id)
    setF((prev) => ({
      ...prev,
      appId: id,
      platforms: a ? a.platforms : prev.platforms,
      trackingUrl: a ? `${a.trackingUrl}&cid={cid}` : prev.trackingUrl,
      utmCampaign: prev.utmCampaign || (a ? `${a.slug}-${new Date().toLocaleString('en-US', { month: 'short' }).toLowerCase()}` : ''),
    }))
    setErrors({})
  }

  const days = Math.max(1, Math.round((new Date(f.endDate).getTime() - new Date(f.startDate).getTime()) / 864e5))
  const estInstalls = f.payoutModel === 'CPC' ? Math.round((f.budget / (f.bid || 1)) * 0.26) : Math.round(f.budget / (f.bid || 1))

  const submit = async (mode: 'launch' | 'draft') => {
    for (let s = 0; s < 6; s++) {
      const e = validate(s, f)
      if (Object.keys(e).length) {
        setErrors(e)
        setStep(s)
        toast({ tone: 'warning', title: 'A few details need attention', description: steps[s].title })
        return
      }
    }
    setSubmitting(mode)
    const input: CampaignInput = {
      name: `${app!.name} — ${f.name.trim()}`,
      objective: f.objective,
      clientId: f.clientId,
      appId: f.appId,
      status: mode === 'draft' ? 'draft' : f.startDate > today ? 'scheduled' : 'active',
      startDate: f.startDate,
      endDate: f.endDate,
      budget: f.budget,
      payoutModel: f.payoutModel,
      bid: f.bid,
      targetInstalls: estInstalls,
      dailyCap: f.dailyCap,
      targeting: { countries: f.countries, platforms: f.platforms, ageRange: [f.ageMin, f.ageMax], interests: f.interests.split(',').map((s) => s.trim()).filter(Boolean), devices: f.devices },
      tracking: { trackingUrl: f.trackingUrl, postbackUrl: f.postbackUrl, attributionPartner: f.attributionPartner, utmSource: f.utmSource, utmCampaign: f.utmCampaign, attributionWindowDays: f.attributionWindowDays },
      sources: ['Campaign', 'Organic Search', 'Social'],
      createdBy: session!.user.id,
      notes: f.notes,
    }
    try {
      const created = await campaignsService.create(input)
      queryClient.invalidate('campaigns')
      toast({
        tone: 'success',
        title: mode === 'draft' ? 'Draft saved' : created.status === 'scheduled' ? 'Campaign scheduled' : 'Campaign launched',
        description: `${created.name} · ${created.id}`,
      })
      navigate(`/dashboard/campaigns/${created.id}`)
    } catch (e) {
      toast({ tone: 'error', title: 'Couldn’t create campaign', description: (e as Error).message })
      setSubmitting(null)
    }
  }

  return (
    <div>
      <PageHeader title="Create campaign" description="Seven quick steps from idea to live traffic. You can save a draft at any point on the last step." />
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Stepper */}
        <nav aria-label="Campaign steps" className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-3 h-1 overflow-hidden rounded-full bg-surface-3 lg:hidden">
            <motion.div className="h-full bg-accent" animate={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
          <p className="mb-2 text-sm font-semibold text-fg lg:hidden">Step {step + 1} of {steps.length}: {steps[step].title}</p>
          <ol className="hidden space-y-1 lg:block">
            {steps.map((s, i) => {
              const done = i < step
              const reachable = i <= maxReached
              return (
                <li key={s.key}>
                  <button
                    onClick={() => reachable && go(i)}
                    disabled={!reachable}
                    aria-current={i === step ? 'step' : undefined}
                    className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors', i === step ? 'bg-surface shadow-sm ring-1 ring-line' : reachable ? 'hover:bg-surface-2' : 'opacity-50')}
                  >
                    <span className={cn('num grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors', done ? 'bg-success text-white' : i === step ? 'bg-accent text-white' : 'bg-surface-3 text-subtle')}>
                      {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                    </span>
                    <span>
                      <span className={cn('block text-[13px] font-semibold', i === step ? 'text-fg' : 'text-muted')}>{s.title}</span>
                      <span className="block text-[11px] text-subtle">{s.hint}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <Card className="overflow-hidden">
          <div className="relative min-h-[460px] overflow-hidden p-5 sm:p-8">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div
                key={step}
                custom={dir}
                initial={{ opacity: 0, x: dir * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -24 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="font-display text-xl font-bold text-fg">{steps[step].title}</h2>
                <div className="mt-6">
                  {step === 0 && (
                    <div className="grid max-w-xl gap-5">
                      <Field label="Campaign name" required error={errors.name} hint="Shown to your team and in client reports. The app name is added automatically.">
                        {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Holiday Savings Push" data-autofocus />}
                      </Field>
                      <Field label="Objective">
                        {() => (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {([
                              ['installs', 'Installs', 'Drive new downloads'],
                              ['engagement', 'Engagement', 'In-app actions after install'],
                              ['reactivation', 'Reactivation', 'Win back lapsed users'],
                              ['awareness', 'Awareness', 'Maximise reach & impressions'],
                            ] as const).map(([v, label, desc]) => (
                              <RadioCard key={v} checked={f.objective === v} onSelect={() => set('objective', v)} name="objective">
                                <span className="block text-sm font-semibold text-fg">{label}</span>
                                <span className="block text-xs text-subtle">{desc}</span>
                              </RadioCard>
                            ))}
                          </div>
                        )}
                      </Field>
                      <Field label="Internal notes" hint="Optional — creative direction, client asks, etc.">
                        {({ id }) => <Textarea id={id} value={f.notes} onChange={(e) => set('notes', e.target.value)} rows={3} />}
                      </Field>
                    </div>
                  )}

                  {step === 1 && <ClientStep clients={clients.data} value={f.clientId} onChange={(id) => { set('clientId', id); if (app && app.clientId !== id) set('appId', '') }} error={errors.clientId} />}

                  {step === 2 && (
                    <div>
                      {errors.appId && <p role="alert" className="mb-3 text-sm font-medium text-danger">{errors.appId}</p>}
                      {!apps.data ? (
                        <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
                      ) : apps.data.filter((a) => a.clientId === f.clientId).length === 0 ? (
                        <EmptyState compact icon={<Search />} title="No applications for this client" description="Add an application for this client before creating a campaign." />
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Application">
                          {apps.data.filter((a) => a.clientId === f.clientId).map((a) => (
                            <RadioCard key={a.id} checked={f.appId === a.id} onSelect={() => selectApp(a.id)} name="app">
                              <span className="flex items-center gap-3">
                                <AppIcon app={a} size="md" />
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold text-fg">{a.name}</span>
                                  <span className="block text-xs text-subtle">{categoryBySlug[a.category].name} · {a.platforms.map((p) => (p === 'ios' ? 'iOS' : 'Android')).join(' & ')}</span>
                                  {a.status !== 'live' && <Badge tone="warning" className="mt-1">{a.status.replace('_', ' ')}</Badge>}
                                </span>
                              </span>
                            </RadioCard>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {step === 3 && (
                    <div className="grid max-w-2xl gap-6">
                      <Field label="Countries" required error={errors.countries} hint={`${f.countries.length} selected`}>
                        {() => (
                          <div className="flex flex-wrap gap-1.5">
                            {countryOptions.map((c) => {
                              const on = f.countries.includes(c.code)
                              return (
                                <button key={c.code} type="button" aria-pressed={on} onClick={() => set('countries', on ? f.countries.filter((x) => x !== c.code) : [...f.countries, c.code])}
                                  className={cn('inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[13px] transition-all active:scale-95', on ? 'border-accent/40 bg-accent-soft font-medium text-accent-text' : 'border-line text-muted hover:border-line-strong hover:text-fg')}>
                                  <span aria-hidden>{c.flag}</span> {c.name}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </Field>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <Field label="Platforms" required error={errors.platforms}>
                          {() => (
                            <div className="flex gap-4">
                              {(['ios', 'android'] as const).map((p) => (
                                <Checkbox key={p} checked={f.platforms.includes(p)} disabled={!!app && !app.platforms.includes(p)} onChange={(v) => set('platforms', v ? [...f.platforms, p] : f.platforms.filter((x) => x !== p))} label={p === 'ios' ? 'iOS' : 'Android'} />
                              ))}
                            </div>
                          )}
                        </Field>
                        <Field label="Devices" required error={errors.devices}>
                          {() => (
                            <div className="flex gap-4">
                              {(['phone', 'tablet'] as const).map((d) => (
                                <Checkbox key={d} checked={f.devices.includes(d)} onChange={(v) => set('devices', v ? [...f.devices, d] : f.devices.filter((x) => x !== d))} label={d === 'phone' ? 'Phones' : 'Tablets'} />
                              ))}
                            </div>
                          )}
                        </Field>
                      </div>
                      <Field label="Age range" error={errors.ageMin}>
                        {({ id }) => (
                          <div className="flex items-center gap-3">
                            <Input id={id} type="number" min={13} max={99} value={f.ageMin} onChange={(e) => set('ageMin', Number(e.target.value))} className="w-24" aria-label="Minimum age" />
                            <span className="text-subtle">to</span>
                            <Input type="number" min={13} max={99} value={f.ageMax} onChange={(e) => set('ageMax', Number(e.target.value))} className="w-24" aria-label="Maximum age" />
                          </div>
                        )}
                      </Field>
                      <Field label="Interests" hint="Comma-separated, e.g. budgeting, personal finance">
                        {({ id }) => <Input id={id} value={f.interests} onChange={(e) => set('interests', e.target.value)} placeholder={app?.tags.join(', ')} />}
                      </Field>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="grid max-w-2xl gap-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Total budget (USD)" required error={errors.budget}>
                          {({ id, invalid, describedBy }) => <Input id={id} invalid={invalid} aria-describedby={describedBy} type="number" min={1000} step={500} value={f.budget} onChange={(e) => set('budget', Number(e.target.value))} leftIcon={<span className="text-xs font-semibold">$</span>} />}
                        </Field>
                        <Field label="Payout model">
                          {() => <SegmentedControl label="Payout model" value={f.payoutModel} onChange={(v) => set('payoutModel', v)} options={(['CPI', 'CPA', 'CPC', 'CPM'] as const).map((v) => ({ value: v, label: v }))} />}
                        </Field>
                        <Field label={`Bid per ${f.payoutModel === 'CPI' ? 'install' : f.payoutModel === 'CPA' ? 'action' : f.payoutModel === 'CPC' ? 'click' : '1,000 impressions'}`} required error={errors.bid}>
                          {({ id, invalid, describedBy }) => <Input id={id} invalid={invalid} aria-describedby={describedBy} type="number" min={0.01} step={0.05} value={f.bid} onChange={(e) => set('bid', Number(e.target.value))} leftIcon={<span className="text-xs font-semibold">$</span>} />}
                        </Field>
                        <Field label="Daily spend cap" required error={errors.dailyCap}>
                          {({ id, invalid, describedBy }) => <Input id={id} invalid={invalid} aria-describedby={describedBy} type="number" min={1} step={50} value={f.dailyCap} onChange={(e) => set('dailyCap', Number(e.target.value))} leftIcon={<span className="text-xs font-semibold">$</span>} />}
                        </Field>
                        <Field label="Start date" required error={errors.startDate}>
                          {({ id, invalid }) => <Input id={id} invalid={invalid} type="date" min={today} value={f.startDate} onChange={(e) => set('startDate', e.target.value)} />}
                        </Field>
                        <Field label="End date" required error={errors.endDate}>
                          {({ id, invalid }) => <Input id={id} invalid={invalid} type="date" min={f.startDate} value={f.endDate} onChange={(e) => set('endDate', e.target.value)} />}
                        </Field>
                      </div>
                      <div className="grid grid-cols-3 gap-3 rounded-2xl bg-surface-2 p-4">
                        <Estimate label="Duration" value={`${days} days`} />
                        <Estimate label="Est. installs" value={formatNumber(estInstalls)} />
                        <Estimate label="Pacing" value={`${formatCurrency(f.budget / days)}/day`} warn={f.dailyCap < f.budget / days ? 'Daily cap is below even pacing — the budget may not fully spend.' : undefined} />
                      </div>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="grid max-w-2xl gap-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Attribution partner">
                          {({ id }) => (
                            <Select id={id} value={f.attributionPartner} onChange={(e) => set('attributionPartner', e.target.value as FormState['attributionPartner'])}>
                              {['AppsFlyer', 'Adjust', 'Branch', 'Singular', 'Kochava', 'None'].map((p) => <option key={p}>{p}</option>)}
                            </Select>
                          )}
                        </Field>
                        <Field label="Attribution window">
                          {({ id }) => (
                            <Select id={id} value={f.attributionWindowDays} onChange={(e) => set('attributionWindowDays', Number(e.target.value))}>
                              {[1, 7, 14, 30].map((d) => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''} click-through</option>)}
                            </Select>
                          )}
                        </Field>
                      </div>
                      <Field label="Tracking URL" required error={errors.trackingUrl} hint="{click_id} and {cid} macros are replaced at click time.">
                        {({ id, invalid, describedBy }) => <Input id={id} invalid={invalid} aria-describedby={describedBy} className="font-mono text-xs" value={f.trackingUrl} onChange={(e) => set('trackingUrl', e.target.value)} />}
                      </Field>
                      <Field label="Postback URL" required error={errors.postbackUrl}>
                        {({ id, invalid, describedBy }) => <Input id={id} invalid={invalid} aria-describedby={describedBy} className="font-mono text-xs" value={f.postbackUrl} onChange={(e) => set('postbackUrl', e.target.value)} />}
                      </Field>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="utm_source">{({ id }) => <Input id={id} value={f.utmSource} onChange={(e) => set('utmSource', e.target.value)} />}</Field>
                        <Field label="utm_campaign" required error={errors.utmCampaign}>{({ id, invalid }) => <Input id={id} invalid={invalid} value={f.utmCampaign} onChange={(e) => set('utmCampaign', e.target.value)} />}</Field>
                      </div>
                    </div>
                  )}

                  {step === 6 && app && client && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 rounded-2xl border border-line p-4">
                        <AppIcon app={app} size="lg" />
                        <div className="min-w-0">
                          <p className="font-display text-lg font-bold text-fg">{app.name} — {f.name}</p>
                          <p className="text-sm text-muted">{client.name} · {f.objective} · {f.payoutModel} at {formatCurrencyPrecise(f.bid)}</p>
                        </div>
                        <Badge tone={f.startDate > today ? 'info' : 'success'} className="ml-auto">{f.startDate > today ? 'Will schedule' : 'Goes live now'}</Badge>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <ReviewBlock title="Audience" onEdit={() => go(3)}>
                          <p>{f.countries.map((c) => `${countryFlag(c)} ${countryName(c)}`).join(', ')}</p>
                          <p>{f.platforms.map((p) => (p === 'ios' ? 'iOS' : 'Android')).join(' & ')} · {f.devices.join(' & ')} · ages {f.ageMin}–{f.ageMax}</p>
                        </ReviewBlock>
                        <ReviewBlock title="Budget & schedule" onEdit={() => go(4)}>
                          <p>{formatCurrency(f.budget)} total · {formatCurrency(f.dailyCap)}/day cap</p>
                          <p>{formatDate(f.startDate)} → {formatDate(f.endDate)} ({days} days)</p>
                          <p>≈ {formatNumber(estInstalls)} installs</p>
                        </ReviewBlock>
                        <ReviewBlock title="Tracking" onEdit={() => go(5)}>
                          <p>{f.attributionPartner} · {f.attributionWindowDays}-day window</p>
                          <p className="truncate font-mono text-xs">{f.trackingUrl}</p>
                        </ReviewBlock>
                        <ReviewBlock title="Details" onEdit={() => go(0)}>
                          <p className="capitalize">{f.objective}</p>
                          <p className="line-clamp-2">{f.notes || 'No internal notes'}</p>
                        </ReviewBlock>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-2/50 px-5 py-4 sm:px-8">
            <Button variant="ghost" onClick={() => (step === 0 ? navigate('/dashboard/campaigns') : go(step - 1))} leftIcon={<ArrowLeft className="size-4" />}>
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => go(step + 1)} rightIcon={<ArrowRight className="size-4" />}>Continue</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => submit('draft')} loading={submitting === 'draft'} disabled={!!submitting} leftIcon={<Save className="size-4" />}>Save draft</Button>
                <Button onClick={() => submit('launch')} loading={submitting === 'launch'} disabled={!!submitting} leftIcon={<Rocket className="size-4" />}>
                  {f.startDate > today ? 'Schedule campaign' : 'Launch campaign'}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function ClientStep({ clients, value, onChange, error }: { clients?: Awaited<ReturnType<typeof clientsService.list>>; value: string; onChange: (id: string) => void; error?: string }) {
  const [q, setQ] = useState('')
  const list = useMemo(() => clients?.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())), [clients, q])
  return (
    <div>
      <div className="mb-4 max-w-sm">
        <Input inputSize="sm" leftIcon={<Search />} placeholder="Search clients" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search clients" />
      </div>
      {error && <p role="alert" className="mb-3 text-sm font-medium text-danger">{error}</p>}
      {!list ? (
        <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label="Client">
          {list.map((c) => (
            <RadioCard key={c.id} checked={value === c.id} onSelect={() => onChange(c.id)} name="client" disabled={c.status === 'churned'}>
              <span className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl font-display text-sm font-bold text-white" style={{ background: `linear-gradient(140deg, ${c.logoColors[0]}, ${c.logoColors[1]})` }}>{c.name[0]}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-fg">{c.name}</span>
                  <span className="block text-xs text-subtle">{c.appCount} apps · {c.tier}{c.status !== 'active' ? ` · ${c.status}` : ''}</span>
                </span>
              </span>
            </RadioCard>
          ))}
        </div>
      )}
    </div>
  )
}

function RadioCard({ checked, onSelect, children, name, disabled }: { checked: boolean; onSelect: () => void; children: ReactNode; name: string; disabled?: boolean }) {
  return (
    <label className={cn('relative flex cursor-pointer rounded-xl border p-3.5 transition-all', checked ? 'border-accent bg-accent-soft/60 ring-1 ring-accent' : 'border-line hover:border-line-strong hover:bg-surface-2/60', disabled && 'cursor-not-allowed opacity-50')}>
      <input type="radio" name={name} checked={checked} onChange={onSelect} disabled={disabled} className="peer sr-only" />
      <span className="flex-1 pr-6">{children}</span>
      <span className={cn('absolute right-3 top-3 grid size-5 place-items-center rounded-full border transition-colors peer-focus-visible:shadow-[var(--ring)]', checked ? 'border-accent bg-accent text-white' : 'border-line-strong')}>
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
    </label>
  )
}

function Estimate({ label, value, warn }: { label: string; value: string; warn?: string }) {
  return (
    <div>
      <p className="text-xs text-subtle">{label}</p>
      <p className={cn('num mt-0.5 font-display text-base font-bold', warn ? 'text-warning' : 'text-fg')} title={warn}>{value}</p>
      {warn && <p className="mt-1 text-[11px] text-warning">{warn}</p>}
    </div>
  )
}

function ReviewBlock({ title, children, onEdit }: { title: string; children: ReactNode; onEdit: () => void }) {
  return (
    <div className="rounded-2xl border border-line p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="eyebrow">{title}</p>
        <button onClick={onEdit} className="text-xs font-semibold text-accent-text hover:underline">Edit</button>
      </div>
      <div className="space-y-1 text-sm text-fg">{children}</div>
    </div>
  )
}

