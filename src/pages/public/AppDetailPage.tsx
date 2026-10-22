import { motion } from 'framer-motion'
import { ChevronRight, Download, ExternalLink, Gift, Info, PackageX, ShieldCheck, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { categoryBySlug } from '@/data/categories'
import { useToast } from '@/context/ToastContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { recordAppView } from '@/hooks/useRecentlyViewed'
import { track } from '@/lib/track'
import { REWARD_COINS } from '@/data/apps'
import { useQuery } from '@/hooks/useQuery'
import { ApiError } from '@/services/api'
import { appsService } from '@/services/appsService'
import type { MobileApp, Platform } from '@/types'
import { formatCompact, formatDate, formatDownloads } from '@/utils/format'
import { AppCard } from '@/components/apps/AppCard'
import { ScreenshotGallery } from '@/components/apps/ScreenshotGallery'
import { AppIcon } from '@/components/ui/AppIcon'
import { Badge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { DynamicIcon } from '@/components/ui/DynamicIcon'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Stars } from '@/components/ui/Rating'
import { PageTransition, Reveal } from '@/components/layout/PageTransition'

function detectPlatform(): Platform {
  return /iphone|ipad|ipod|macintosh/i.test(navigator.userAgent) ? 'ios' : 'android'
}

function useDownload(app: MobileApp | undefined) {
  const toast = useToast()
  const [pending, setPending] = useState<Platform | 'web' | null>(null)
  /** Without a store, opens the brand's official website. */
  const go = async (store?: Platform) => {
    if (!app) return
    setPending(store ?? 'web')
    // Open synchronously to keep the user-gesture (avoids popup blockers), then redirect.
    const win = window.open('about:blank', '_blank')
    try {
      const { redirect, reward } = await appsService.trackClick(app, store)
      if (win) {
        win.opener = null
        win.location.href = redirect
      } else window.location.href = redirect
      const where = store === 'ios' ? 'the App Store' : store === 'android' ? 'Google Play' : 'the official website'
      toast({
        tone: 'success',
        title: `Opening ${where}`,
        description:
          reward === 'pending'
            ? `${REWARD_COINS} Osh coins are pending in your wallet. They're added once your install is confirmed.`
            : reward === 'confirmed'
              ? `You've already earned the ${REWARD_COINS} Osh coins for ${app.name}.`
              : store ? `${app.name} opens on its official store listing.` : `${app.name} opens on its own website.`,
      })
    } catch (e) {
      win?.close()
      toast({ tone: 'error', title: 'Couldn’t open the store', description: (e as Error).message })
    } finally {
      setPending(null)
    }
  }
  return { go, pending }
}

const hasStore = (app: MobileApp) => !!(app.appStoreUrl || app.playStoreUrl)

function StoreButtons({ app, size = 'lg', pending, onDownload }: { app: MobileApp; size?: 'lg' | 'md'; pending: Platform | 'web' | null; onDownload: (p?: Platform) => void }) {
  if (!hasStore(app)) {
    return (
      <Button size={size} loading={pending === 'web'} onClick={() => onDownload()} leftIcon={<ExternalLink className="size-4" />} className={size === 'lg' ? 'min-w-48' : 'w-full'}>
        Visit official website
      </Button>
    )
  }
  const preferred = app.platforms.includes(detectPlatform()) ? detectPlatform() : app.platforms[0]
  const ordered = [...app.platforms].sort((a) => (a === preferred ? -1 : 1))
  return (
    <div className={size === 'md' ? 'flex flex-col gap-2' : 'flex flex-col gap-2.5 sm:flex-row'}>
      {ordered.map((p, i) => (
        <Button
          key={p}
          size={size}
          variant={i === 0 ? 'primary' : 'outline'}
          loading={pending === p}
          onClick={() => onDownload(p)}
          leftIcon={<Download className="size-4" />}
          className={i === 0 && size === 'lg' ? 'min-w-48' : undefined}
        >
          {i === 0 ? 'Download app' : ''} {i === 0 ? <span className="font-normal">· {p === 'ios' ? 'App Store' : 'Google Play'}</span> : p === 'ios' ? 'App Store' : 'Google Play'}
        </Button>
      ))}
    </div>
  )
}

export default function AppDetailPage() {
  const { slug = '' } = useParams()
  const { data: app, error, refetch } = useQuery(`apps:detail:${slug}`, () => appsService.getBySlug(slug))
  const similar = useQuery(app ? `apps:similar:${app.id}` : null, () => appsService.similar(app!.id, 4))
  const { go, pending } = useDownload(app)
  useDocumentTitle(app?.name)
  useEffect(() => {
    if (!app) return
    recordAppView(app.id)
    track('app_view', app.id)
  }, [app])

  if (error) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <div className="container-page py-20">
          <EmptyState
            icon={<PackageX />}
            title="Application not found"
            description="This app may have finished its campaign or been removed from OshAds. Explore similar apps instead."
            action={<ButtonLink to="/explore">Explore apps</ButtonLink>}
          />
        </div>
      )
    }
    return <ErrorState error={error} onRetry={refetch} className="container-page py-20" />
  }
  if (!app) return <DetailSkeleton />

  const cat = categoryBySlug[app.category]
  const ratingBars = app.ratingDistribution

  // Rich-result data for Google. Ratings must be the app's real store ratings once live data replaces the seed.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: app.name,
    description: app.tagline,
    applicationCategory: app.category === 'loans' ? 'FinanceApplication' : `${cat.name}Application`, // schema.org has no loans type
    ...(app.platforms.length > 0 && { operatingSystem: app.platforms.map((p) => (p === 'ios' ? 'iOS' : 'Android')).join(', ') }),
    author: { '@type': 'Organization', name: app.developer, ...(app.website && { url: app.website }), ...(app.linkedinUrl && { sameAs: [app.linkedinUrl] }) },
    // shortcut: assumes store-listed apps are free to download; add a price field to MobileApp before listing paid apps.
    ...(hasStore(app) && { offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' } }),
    ...(app.ratingCount > 0 && { aggregateRating: { '@type': 'AggregateRating', ratingValue: app.rating, ratingCount: app.ratingCount } }),
  }

  return (
    <PageTransition>
      {/* Escape "<" so app text can never close the script tag. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <link rel="canonical" href={`${location.origin}/app/${app.slug}`} />
      {/* Header */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="container-page relative py-8 sm:py-12">
          <div>
            <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-[13px] text-subtle">
              <Link to="/explore" className="hover:text-fg">Explore</Link>
              <ChevronRight className="size-3.5" aria-hidden />
              <Link to={`/categories/${cat.slug}`} className="hover:text-fg">{cat.name}</Link>
              <ChevronRight className="size-3.5" aria-hidden />
              <span className="text-fg" aria-current="page">{app.name}</span>
            </nav>
            <div className="flex items-start gap-5">
              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                <AppIcon app={app} size="xl" className="shadow-lg" />
              </motion.div>
              <div className="min-w-0 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  {app.badge && <Badge tone={app.badge === 'Reward' ? 'warning' : 'accent'}>{app.badge}</Badge>}
                  <Badge tone="neutral">Sponsored</Badge>
                </div>
                <h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-0.03em] text-fg sm:text-5xl">{app.name}</h1>
                <p className="mt-1 text-[15px] text-muted">{app.tagline}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle">
                  <span>by <span className="font-medium text-fg">{app.developer}</span></span>
                  {app.website && <a href={app.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent-text hover:underline">{new URL(app.website).hostname.replace(/^www\./, '')} <ExternalLink className="size-3" aria-hidden /></a>}
                  {app.linkedinUrl && <a href={app.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent-text hover:underline">LinkedIn <ExternalLink className="size-3" aria-hidden /></a>}
                </p>
              </div>
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-y-4 rounded-2xl glass p-4 backdrop-blur sm:grid-cols-4 sm:divide-x sm:divide-line sm:p-0">
              {app.ratingCount > 0 && <Stat label={`${formatCompact(app.ratingCount)} ratings`} value={<span className="inline-flex items-center gap-1">{app.rating.toFixed(1)} <Star className="size-4 text-gold-500" fill="currentColor" strokeWidth={0} /></span>} />}
              {app.downloads > 0 && <Stat label="Downloads" value={formatDownloads(app.downloads)} />}
              <Stat label="Category" value={cat.name} />
              {app.platforms.length > 0 && <Stat label="Platforms" value={app.platforms.map((p) => (p === 'ios' ? 'iOS' : 'Android')).join(' · ')} />}
              <Stat label="Age" value={app.ageRating} />
            </dl>

            {app.reward && (
              <p className="mt-5 flex items-start gap-2.5 rounded-xl border border-gold-500/30 bg-gold-500/10 p-3 text-sm text-fg">
                <Gift className="mt-0.5 size-4 shrink-0 text-[#B07100] dark:text-gold-500" aria-hidden />
                <span><span className="font-semibold">Earn {app.reward}</span> when you install through OshAds. They're added to your <Link to="/rewards" className="font-medium underline">wallet</Link> once the install is confirmed.</span>
              </p>
            )}

            <div className="mt-6">
              <StoreButtons app={app} pending={pending} onDownload={go} />
              <p className="mt-3 flex items-center gap-1.5 text-xs text-subtle">
                <ShieldCheck className="size-3.5 text-success" aria-hidden /> {hasStore(app) ? ['Free to download', 'Opens the official store listing', app.size].filter(Boolean).join(' · ') : 'Opens the lender’s official website'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-14 py-14 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-14">
          <Reveal>
            <section aria-labelledby="about-title">
              <h2 id="about-title" className="font-display text-2xl font-bold tracking-tight text-fg">About {app.name}</h2>
              <p className="mt-3 max-w-3xl text-[15px] leading-7 text-muted">{app.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {app.tags.map((t) => (
                  <Link key={t} to={`/search?q=${encodeURIComponent(t)}`} className="inline-flex min-h-10 items-center rounded-full bg-surface-2 px-3.5 text-[13px] text-muted transition hover:bg-accent-soft hover:text-accent-text sm:min-h-8">#{t}</Link>
                ))}
              </div>
            </section>
          </Reveal>

          {(app.benefits.length > 0 || app.ratingCount > 0) && <Reveal>
            <section aria-labelledby="why-title" className="rounded-[24px] glass p-6 sm:p-8">
              <h2 id="why-title" className="font-display text-2xl font-bold tracking-tight text-fg">Why you’ll like it</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {[...app.benefits, ...(app.ratingCount > 0 ? [`Rated ${app.rating.toFixed(1)}★ by ${formatCompact(app.ratingCount)} people`] : [])].map((b, i) => (
                  <motion.li key={b} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                      <svg viewBox="0 0 12 12" className="size-3" aria-hidden><path d="M2.5 6.2 5 8.5 9.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                    <span className="text-[15px] text-fg">{b}</span>
                  </motion.li>
                ))}
              </ul>
            </section>
          </Reveal>}

          {(app.screenshots > 0 || !!app.screenshotImages?.length) && (
            <section aria-labelledby="shots-title">
              <h2 id="shots-title" className="-mb-12 font-display text-2xl font-bold tracking-tight text-fg">Screenshots</h2>
              <ScreenshotGallery app={app} />
            </section>
          )}

          {app.features.length > 0 && <section aria-labelledby="feat-title">
            <h2 id="feat-title" className="font-display text-2xl font-bold tracking-tight text-fg">Key features</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {app.features.map((f, i) => (
                <Reveal key={f.title} delay={i * 0.06}>
                  <div className="group h-full rounded-[20px] glass p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                    <span className="grid size-11 place-items-center rounded-xl text-white transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" style={{ background: `linear-gradient(145deg, ${app.colors[0]}, ${app.colors[1]})` }}>
                      <DynamicIcon name={f.icon} className="size-5" />
                    </span>
                    <h3 className="mt-4 font-display text-base font-bold text-fg">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{f.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>}

          {app.ratingCount > 0 && <section aria-labelledby="rating-title">
            <h2 id="rating-title" className="font-display text-2xl font-bold tracking-tight text-fg">Ratings</h2>
            <div className="mt-5 flex flex-col gap-8 rounded-[24px] glass p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="text-center sm:w-44">
                <p className="num font-display text-6xl font-extrabold tracking-tighter text-fg">{app.rating.toFixed(1)}</p>
                <Stars value={app.rating} size={18} className="mt-2" />
                <p className="num mt-2 text-sm text-subtle">{app.ratingCount.toLocaleString()} ratings</p>
              </div>
              <div className="flex-1 space-y-2">
                {ratingBars.map((share, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="num w-6 text-right text-xs font-semibold text-muted">{5 - i}★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                      <motion.div className="h-full rounded-full bg-gold-500" initial={{ width: 0 }} whileInView={{ width: `${share * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }} />
                    </div>
                    <span className="num w-10 text-right text-xs text-subtle">{Math.round(share * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-subtle"><Info className="size-3.5" aria-hidden /> Ratings aggregated from the App Store and Google Play.</p>
          </section>}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[20px] glass p-5">
            <div className="flex items-center gap-3">
              <AppIcon app={app} size="md" />
              <div>
                <p className="font-display font-bold text-fg">{app.name}</p>
                <p className="text-xs text-subtle">{app.developer}</p>
              </div>
            </div>
            <div className="mt-4">
              <StoreButtons app={app} size="md" pending={pending} onDownload={go} />
            </div>
            <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-sm">
              {[
                ['Version', app.version],
                ['Listed', app.updatedAt && formatDate(app.updatedAt)],
                ['Size', app.size],
                ['Age rating', app.ageRating],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-subtle">{k}</dt>
                  <dd className="num font-medium text-fg">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-[20px] border border-line bg-surface-2/50 p-5 text-[13px] leading-relaxed text-muted">
            <p className="font-semibold text-fg">Why you’re seeing this</p>
            <p className="mt-1">{app.name} is a sponsored campaign from {app.developer}. Our team reviewed it for quality and privacy before featuring it.</p>
            <Link to="/about#trust" className="mt-2 inline-flex items-center gap-1 font-medium text-accent-text hover:underline">How we review apps <ExternalLink className="size-3" /></Link>
          </div>
        </aside>
      </div>

      <section className="border-t border-line bg-surface py-14" aria-labelledby="similar-title">
        <div className="container-page">
          <h2 id="similar-title" className="font-display text-2xl font-bold tracking-tight text-fg">Similar apps</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similar.data ? similar.data.map((a) => <AppCard key={a.id} app={a} />) : Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-[20px]" />)}
          </div>
        </div>
      </section>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3">
          <AppIcon app={app} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg">{app.name}</p>
            <p className="num truncate text-xs text-subtle">{[app.rating > 0 && `★ ${app.rating.toFixed(1)}`, app.downloads > 0 && formatDownloads(app.downloads), app.website && new URL(app.website).hostname.replace(/^www\./, '')].filter(Boolean).join(' · ')}</p>
          </div>
          <Button size="md" loading={!!pending} onClick={() => go(hasStore(app) ? (app.platforms.includes(detectPlatform()) ? detectPlatform() : app.platforms[0]) : undefined)} leftIcon={hasStore(app) ? <Download className="size-4" /> : <ExternalLink className="size-4" />}>
            {hasStore(app) ? 'Get' : 'Visit'}
          </Button>
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </PageTransition>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="sm:px-5 sm:py-4">
      <dd className="num font-display text-lg font-bold text-fg">{value}</dd>
      <dt className="text-xs text-subtle">{label}</dt>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="container-page py-12" aria-busy="true" aria-label="Loading app">
      <Skeleton className="h-4 w-48" />
      <div className="mt-8 flex gap-5">
        <Skeleton className="size-24 rounded-[26px]" />
        <div className="flex-1 space-y-3 pt-2">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
      <Skeleton className="mt-8 h-20 w-full max-w-2xl rounded-2xl" />
      <Skeleton className="mt-6 h-12 w-56 rounded-xl" />
      <div className="mt-14 space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full max-w-3xl" />
        <Skeleton className="h-4 w-5/6 max-w-3xl" />
      </div>
    </div>
  )
}
