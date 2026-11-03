import { ImagePlus, Plus, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '@/context/ToastContext'
import { categories } from '@/data/categories'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { appsService } from '@/services/appsService'
import { clientsService } from '@/services/clientsService'
import { queryClient } from '@/services/queryClient'
import type { AppFeature, AppStatus, CategorySlug, MobileApp, Platform, ScreenArchetype } from '@/types'
import { cn } from '@/utils/cn'
import { readImage } from '@/utils/image'
import { AppCard } from '@/components/apps/AppCard'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DynamicIcon, iconNames } from '@/components/ui/DynamicIcon'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Form'
import { PageHeader } from '@/components/layout/DashboardLayout'

const archetypeFor: Record<CategorySlug, ScreenArchetype> = {
  loans: 'ledger', betting: 'game', trading: 'ledger', crypto: 'ledger', banking: 'ledger', insurance: 'list', food: 'grid', social: 'chat', mobility: 'map', finance: 'ledger', shopping: 'grid', gaming: 'game', productivity: 'list', education: 'rings', entertainment: 'media',
  lifestyle: 'grid', utilities: 'list', health: 'rings', travel: 'map', ai: 'chat', business: 'ledger',
}

const palettes: Array<[string, string]> = [
  ['#3D7BFF', '#1433B0'], ['#34D399', '#047857'], ['#60A5FA', '#1D4ED8'], ['#A78BFA', '#5B21B6'],
  ['#F472B6', '#BE185D'], ['#FBBF24', '#D97706'], ['#22D3EE', '#0E7490'], ['#94A3B8', '#334155'],
]

type Draft = Omit<MobileApp, 'id' | 'slug' | 'ratingDistribution' | 'trackingUrl'> & { trackingUrl: string }

const blank: Draft = {
  // No made-up numbers: rating, downloads and screenshots start empty until real ones are entered.
  name: '', tagline: '', description: '', category: 'loans', clientId: '', developer: '', platforms: [],
  rating: 0, ratingCount: 0, downloads: 0, size: '', version: '', updatedAt: new Date().toISOString().slice(0, 10), ageRating: '',
  icon: 'sparkles', colors: palettes[0], archetype: 'list', screenshots: 0,
  features: [{ icon: 'zap', title: '', description: '' }], benefits: [''], tags: [], weeklyGrowth: 0, appStoreUrl: '', playStoreUrl: '',
  trackingUrl: '', status: 'draft', screenshotImages: [],
}

export default function AppFormPage() {
  const { id } = useParams()
  const editing = !!id
  useDocumentTitle(editing ? 'Edit application' : 'Add application')
  const navigate = useNavigate()
  const toast = useToast()
  const existing = useQuery(id ? `apps:detail:id:${id}` : null, () => appsService.getById(id!))
  const clients = useQuery('clients:list', () => clientsService.list())
  const [d, setD] = useState<Draft>(blank)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const iconInput = useRef<HTMLInputElement>(null)
  const shotsInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (existing.data) setD({ ...existing.data, screenshotImages: existing.data.screenshotImages ?? [] })
  }, [existing.data])

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((p) => ({ ...p, [k]: v }))
    setErrors((e) => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (d.name.trim().length < 2) e.name = 'App name is required.'
    if (d.tagline.trim().length < 6) e.tagline = 'Add a short, benefit-led tagline.'
    if (d.description.trim().length < 40) e.description = 'Description should be at least 40 characters.'
    if (!d.clientId) e.clientId = 'Select the client (developer).'
    if (d.platforms.includes('ios') && !/^https:\/\/apps\.apple\.com\//.test(d.appStoreUrl ?? '')) e.appStoreUrl = 'Enter an App Store URL (https://apps.apple.com/…).'
    if (d.platforms.includes('android') && !/^https:\/\/play\.google\.com\//.test(d.playStoreUrl ?? '')) e.playStoreUrl = 'Enter a Google Play URL (https://play.google.com/…).'
    if (d.rating < 0 || d.rating > 5) e.rating = 'Rating must be between 0 and 5.'
    if (!/^https:\/\/\S+$/.test(d.trackingUrl)) e.trackingUrl = 'Enter the link visitors are sent to, starting with https://'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = async () => {
    if (!validate()) {
      toast({ tone: 'warning', title: 'Check the highlighted fields' })
      document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSaving(true)
    const client = clients.data?.find((c) => c.id === d.clientId)
    const payload = {
      ...d,
      developer: client?.name ?? d.developer,
      archetype: archetypeFor[d.category],
      features: d.features.filter((f) => f.title.trim()),
      benefits: d.benefits.filter((b) => b.trim()),
      screenshots: d.screenshotImages?.length ?? 0, // only real uploaded screens
    }
    try {
      const saved = editing ? await appsService.update(id!, payload) : await appsService.create(payload)
      queryClient.invalidate('apps')
      toast({ tone: 'success', title: editing ? 'Application updated' : 'Application added', description: saved.name })
      navigate(`/dashboard/apps/${saved.id}`)
    } catch (e) {
      toast({ tone: 'error', title: 'Couldn’t save application', description: (e as Error).message })
      setSaving(false)
    }
  }

  const onIcon = async (file?: File) => {
    if (!file) return
    try {
      set('iconImage', await readImage(file, 192, 'image/png'))
    } catch (e) {
      toast({ tone: 'error', title: 'Icon upload failed', description: (e as Error).message })
    }
  }
  const onShots = async (files: FileList | null) => {
    if (!files) return
    const room = 6 - (d.screenshotImages?.length ?? 0)
    try {
      const imgs = await Promise.all(Array.from(files).slice(0, room).map((f) => readImage(f, 360)))
      set('screenshotImages', [...(d.screenshotImages ?? []), ...imgs])
    } catch (e) {
      toast({ tone: 'error', title: 'Screenshot upload failed', description: (e as Error).message })
    }
  }

  if (editing && existing.error) return <ErrorState title="Application not found" error={existing.error} onRetry={existing.refetch} />
  if (editing && !existing.data) return <Skeleton className="h-[600px]" />

  const preview: MobileApp = {
    ...d,
    id: 'preview',
    slug: 'preview',
    name: d.name || 'Your app name',
    tagline: d.tagline || 'A short benefit-led tagline appears here.',
    developer: clients.data?.find((c) => c.id === d.clientId)?.name ?? 'Developer',
    archetype: archetypeFor[d.category],
    features: d.features.some((f) => f.title) ? d.features.filter((f) => f.title) : [{ icon: 'zap', title: 'Key feature', description: 'Describe it' }],
    ratingDistribution: [0.7, 0.2, 0.05, 0.02, 0.03],
  }

  return (
    <div>
      <PageHeader
        title={editing ? `Edit ${existing.data?.name}` : 'Add application'}
        description="Everything users see on the public listing. Changes to live apps publish immediately."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save changes' : 'Add application'}</Button>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Basics" />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label="App name" required error={errors.name}>{({ id, invalid }) => <Input id={id} invalid={invalid} value={d.name} onChange={(e) => set('name', e.target.value)} />}</Field>
              <Field label="Developer (client)" required error={errors.clientId}>
                {({ id, invalid }) => (
                  <Select id={id} invalid={invalid} value={d.clientId} onChange={(e) => set('clientId', e.target.value)}>
                    <option value="">Select client…</option>
                    {clients.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                )}
              </Field>
              <Field label="Tagline" required error={errors.tagline} className="sm:col-span-2" hint={`${d.tagline.length}/60`}>
                {({ id, invalid, describedBy }) => <Input id={id} invalid={invalid} aria-describedby={describedBy} maxLength={60} value={d.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="e.g. Manage your money smarter." />}
              </Field>
              <Field label="Description" required error={errors.description} className="sm:col-span-2">
                {({ id, invalid }) => <Textarea id={id} invalid={invalid} rows={5} value={d.description} onChange={(e) => set('description', e.target.value)} />}
              </Field>
              <Field label="Category">
                {({ id }) => (
                  <Select id={id} value={d.category} onChange={(e) => set('category', e.target.value as CategorySlug)}>
                    {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </Select>
                )}
              </Field>
              <Field label="Campaign status">
                {({ id }) => (
                  <Select id={id} value={d.status} onChange={(e) => set('status', e.target.value as AppStatus)}>
                    <option value="draft">Draft — not visible</option>
                    <option value="in_review">In review</option>
                    <option value="live">Live — visible to users</option>
                    <option value="paused">Paused</option>
                  </Select>
                )}
              </Field>
              <Field label="Platforms" error={errors.platforms} hint="Only if the app is on a store; website-only listings need none.">
                {() => (
                  <div className="flex h-10 items-center gap-5">
                    {(['ios', 'android'] as Platform[]).map((p) => (
                      <Checkbox key={p} checked={d.platforms.includes(p)} onChange={(v) => set('platforms', v ? [...d.platforms, p] : d.platforms.filter((x) => x !== p))} label={p === 'ios' ? 'iOS' : 'Android'} />
                    ))}
                  </div>
                )}
              </Field>
              <Field label="Tags" hint="Comma-separated search keywords">
                {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={d.tags.join(', ')} onChange={(e) => set('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))} />}
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Store & tracking" />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label="App Store URL" error={errors.appStoreUrl} required={d.platforms.includes('ios')}>{({ id, invalid }) => <Input id={id} invalid={invalid} disabled={!d.platforms.includes('ios')} value={d.appStoreUrl ?? ''} onChange={(e) => set('appStoreUrl', e.target.value)} placeholder="https://apps.apple.com/app/…" />}</Field>
              <Field label="Play Store URL" error={errors.playStoreUrl} required={d.platforms.includes('android')}>{({ id, invalid }) => <Input id={id} invalid={invalid} disabled={!d.platforms.includes('android')} value={d.playStoreUrl ?? ''} onChange={(e) => set('playStoreUrl', e.target.value)} placeholder="https://play.google.com/store/apps/details?id=…" />}</Field>
              <Field
                label="Tracking URL"
                required
                error={errors.trackingUrl}
                hint={
                  d.trackingUrl.includes('{click_id}')
                    ? 'Installs can be confirmed automatically: {click_id} is replaced with each click’s ID.'
                    : 'Paste the advertiser’s tracking link and put {click_id} where it expects your click ID, so installs are confirmed automatically. Without it, staff confirm installs by hand.'
                }
                className="sm:col-span-2"
              >{({ id, invalid, describedBy }) => <Input id={id} invalid={invalid} aria-describedby={describedBy} className="font-mono text-xs" value={d.trackingUrl} onChange={(e) => set('trackingUrl', e.target.value)} />}</Field>
              <Field label="Store rating" error={errors.rating}>{({ id, invalid }) => <Input id={id} invalid={invalid} type="number" step={0.1} min={0} max={5} value={d.rating} onChange={(e) => set('rating', Number(e.target.value))} />}</Field>
              <Field label="Download count">{({ id }) => <Input id={id} type="number" min={0} step={1000} value={d.downloads} onChange={(e) => set('downloads', Number(e.target.value))} />}</Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Icon & screenshots" description="Upload brand assets, or use a generated icon." />
            <CardBody className="space-y-6">
              <div className="flex flex-wrap items-start gap-6">
                <div>
                  <p className="mb-2 text-[13px] font-medium text-fg">App icon</p>
                  <button
                    type="button"
                    onClick={() => iconInput.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); onIcon(e.dataTransfer.files[0]) }}
                    className="group relative grid size-24 place-items-center overflow-hidden rounded-[26px] border-2 border-dashed border-line-strong bg-surface-2 transition hover:border-accent"
                    aria-label="Upload app icon"
                  >
                    {d.iconImage ? <img src={d.iconImage} alt="" className="size-full object-cover" /> : <ImagePlus className="size-6 text-subtle group-hover:text-accent-text" />}
                  </button>
                  <input ref={iconInput} aria-label="Upload app icon image" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => onIcon(e.target.files?.[0])} />
                  {d.iconImage && <button type="button" onClick={() => set('iconImage', undefined)} className="mt-2 text-xs font-medium text-danger hover:underline">Remove</button>}
                </div>
                {!d.iconImage && (
                  <div className="min-w-0 flex-1 space-y-3">
                    <p className="text-[13px] font-medium text-fg">Generated icon</p>
                    <div className="flex flex-wrap gap-1.5">
                      {palettes.map((p) => (
                        <button key={p.join()} type="button" onClick={() => set('colors', p)} aria-label={`Colour ${p[0]}`} aria-pressed={d.colors[0] === p[0]} className={cn('size-7 rounded-lg ring-offset-2 ring-offset-surface transition', d.colors[0] === p[0] && 'ring-2 ring-accent')} style={{ background: `linear-gradient(140deg, ${p[0]}, ${p[1]})` }} />
                      ))}
                    </div>
                    <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto">
                      {iconNames.slice(0, 48).map((n) => (
                        <button key={n} type="button" onClick={() => set('icon', n)} aria-label={`Glyph ${n}`} aria-pressed={d.icon === n} className={cn('grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg', d.icon === n && 'bg-accent-soft text-accent-text')}>
                          <DynamicIcon name={n} className="size-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <p className="mb-2 text-[13px] font-medium text-fg">Screenshots <span className="font-normal text-subtle">· up to 6, portrait 9:19.5 recommended</span></p>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {d.screenshotImages?.map((src, i) => (
                    <div key={i} className="group relative w-24 shrink-0 overflow-hidden rounded-xl border border-line">
                      <img src={src} alt={`Screenshot ${i + 1}`} className="aspect-[9/19.5] w-full object-cover" />
                      <button type="button" onClick={() => set('screenshotImages', d.screenshotImages!.filter((_, j) => j !== i))} className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-ink-950/70 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100" aria-label={`Remove screenshot ${i + 1}`}>
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  {(d.screenshotImages?.length ?? 0) < 6 && (
                    <button
                      type="button"
                      onClick={() => shotsInput.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); onShots(e.dataTransfer.files) }}
                      className="grid aspect-[9/19.5] w-24 shrink-0 place-items-center rounded-xl border-2 border-dashed border-line-strong text-subtle transition hover:border-accent hover:text-accent-text"
                    >
                      <span className="flex flex-col items-center gap-1 text-[11px] font-medium"><Upload className="size-5" />Upload</span>
                    </button>
                  )}
                  <input ref={shotsInput} aria-label="Upload screenshot images" type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onShots(e.target.files)} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Features & benefits" description="Shown in “Key features” and “Why you’ll like it”." />
            <CardBody className="space-y-6">
              <div className="space-y-3">
                {errors.features && <p role="alert" className="text-xs font-medium text-danger">{errors.features}</p>}
                {d.features.map((f, i) => (
                  <div key={i} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[120px_1fr_1.4fr_auto]">
                    <Select selectSize="sm" value={f.icon} onChange={(e) => set('features', d.features.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)))} aria-label="Feature icon">
                      {iconNames.map((n) => <option key={n} value={n}>{n}</option>)}
                    </Select>
                    <Input inputSize="sm" placeholder="Feature title" value={f.title} onChange={(e) => set('features', d.features.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} aria-label="Feature title" />
                    <Input inputSize="sm" placeholder="One-line description" value={f.description} onChange={(e) => set('features', d.features.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} aria-label="Feature description" />
                    <Button variant="ghost" size="sm" iconOnly aria-label="Remove feature" onClick={() => set('features', d.features.filter((_, j) => j !== i))} disabled={d.features.length === 1}><Trash2 className="size-4" /></Button>
                  </div>
                ))}
                {d.features.length < 6 && <Button variant="outline" size="sm" leftIcon={<Plus className="size-3.5" />} onClick={() => set('features', [...d.features, { icon: 'sparkles', title: '', description: '' } as AppFeature])}>Add feature</Button>}
              </div>
              <div className="space-y-2">
                <p className="text-[13px] font-medium text-fg">Benefits</p>
                {d.benefits.map((b, i) => (
                  <div key={i} className="flex gap-2">
                    <Input inputSize="sm" value={b} placeholder="e.g. Works offline" onChange={(e) => set('benefits', d.benefits.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`Benefit ${i + 1}`} />
                    <Button variant="ghost" size="sm" iconOnly aria-label="Remove benefit" onClick={() => set('benefits', d.benefits.filter((_, j) => j !== i))} disabled={d.benefits.length === 1}><Trash2 className="size-4" /></Button>
                  </div>
                ))}
                {d.benefits.length < 6 && <Button variant="outline" size="sm" leftIcon={<Plus className="size-3.5" />} onClick={() => set('benefits', [...d.benefits, ''])}>Add benefit</Button>}
              </div>
            </CardBody>
          </Card>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <p className="eyebrow mb-3">Live preview</p>
          <div className="pointer-events-none">
            <AppCard app={preview} />
          </div>
          <p className="mt-3 text-xs text-subtle">This is how the app appears in Explore and category pages.</p>
        </aside>
      </div>
    </div>
  )
}
