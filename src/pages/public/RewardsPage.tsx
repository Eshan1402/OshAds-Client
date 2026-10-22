import { Coins, Gift, Hourglass, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { REWARD_COINS } from '@/data/apps'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { appsService } from '@/services/appsService'
import { rewardsService } from '@/services/rewardsService'
import { formatDate, formatNumber } from '@/utils/format'
import { AppCard, AppCardSkeleton } from '@/components/apps/AppCard'
import { AppIcon } from '@/components/ui/AppIcon'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { PageTransition } from '@/components/layout/PageTransition'

const statusLabel = { pending: ['Pending', 'warning'], confirmed: ['Added', 'success'], rejected: ['Not confirmed', 'neutral'] } as const

export default function RewardsPage() {
  useDocumentTitle('Osh coins')
  const wallet = useQuery('rewards:wallet', () => rewardsService.wallet())
  const apps = useQuery('apps:list:all', () => appsService.list())
  const byId = new Map(apps.data?.map((a) => [a.id, a]))
  const earned = new Set(wallet.data?.items.filter((i) => i.status !== 'rejected').map((i) => i.appId))
  const toEarn = apps.data?.filter((a) => a.reward && !earned.has(a.id)) ?? []

  return (
    <PageTransition>
      <section className="container-page py-12 sm:py-16">
        <p className="eyebrow inline-flex items-center gap-1.5 !text-accent-text"><Coins className="size-3.5" /> Rewards</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.03em] text-fg sm:text-5xl">Your Osh coins</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Install an app through OshAds and earn {REWARD_COINS} Osh coins. Coins show as pending until the app’s developer confirms the install, then they’re
          added to your wallet. One reward per app. No sign-up needed.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[20px] glass p-5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-subtle"><Coins className="size-3.5" /> Balance</p>
            <p className="num mt-2 font-display text-4xl font-bold text-fg">{wallet.data ? formatNumber(wallet.data.balance) : '—'}</p>
            <p className="mt-1 text-xs text-muted">Osh coins ready to use</p>
          </div>
          <div className="rounded-[20px] glass p-5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-subtle"><Hourglass className="size-3.5" /> Pending</p>
            <p className="num mt-2 font-display text-4xl font-bold text-fg">{wallet.data ? formatNumber(wallet.data.pending) : '—'}</p>
            <p className="mt-1 text-xs text-muted">Waiting for install confirmation</p>
          </div>
          <div className="rounded-[20px] border border-dashed border-line-strong p-5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-subtle"><Ticket className="size-3.5" /> Coupons</p>
            <p className="mt-2 font-display text-xl font-bold text-fg">Coming soon</p>
            <p className="mt-1 text-xs text-muted">Swap your coins for coupons. Your balance is kept until then.</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-subtle">Your wallet is saved in this browser. Clearing site data or switching device starts a new wallet.</p>

        <h2 className="mt-12 font-display text-2xl font-bold tracking-tight text-fg">History</h2>
        {wallet.error ? (
          <ErrorState error={wallet.error} onRetry={wallet.refetch} className="mt-4" />
        ) : !wallet.data ? (
          <Skeleton className="mt-4 h-24 rounded-[20px]" />
        ) : wallet.data.items.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<Gift />}
            title="No coins yet"
            description={`Pick an app below and tap Download or Visit official website. ${REWARD_COINS} coins appear here straight away as pending.`}
          />
        ) : (
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">
            {wallet.data.items.map((i) => {
              const app = byId.get(i.appId)
              const [label, tone] = statusLabel[i.status]
              return (
                <li key={i.appId} className="flex items-center gap-3 p-3 sm:p-4">
                  {app ? <AppIcon app={app} size="sm" /> : <span className="size-9" />}
                  <div className="min-w-0 flex-1">
                    {app ? <Link to={`/app/${app.slug}`} className="truncate font-semibold text-fg hover:underline">{app.name}</Link> : <span className="text-fg">{i.appId}</span>}
                    <p className="text-xs text-subtle">{formatDate(new Date(i.createdAt).toISOString())}</p>
                  </div>
                  <span className="num text-sm font-semibold text-fg">+{i.coins}</span>
                  <Badge tone={tone}>{label}</Badge>
                </li>
              )
            })}
          </ul>
        )}

        <div className="mt-12 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-bold tracking-tight text-fg">Apps you can earn from</h2>
          <ButtonLink to="/explore" variant="outline" size="sm">Explore all apps</ButtonLink>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {apps.data ? toEarn.slice(0, 12).map((a) => <AppCard key={a.id} app={a} />) : Array.from({ length: 4 }).map((_, i) => <AppCardSkeleton key={i} />)}
        </div>
      </section>
    </PageTransition>
  )
}
