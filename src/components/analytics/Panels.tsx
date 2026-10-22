import { AnimatePresence, motion } from 'framer-motion'
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, CircleAlert, Radio, TrendingDown, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { rangeKeyOf, useDashboard } from '@/context/DashboardContext'
import { useQuery } from '@/hooks/useQuery'
import { useLiveVisitors } from '@/hooks/useRealtime'
import { analyticsService, type Scope } from '@/services/analyticsService'
import { notificationsService } from '@/services/notificationsService'
import { cn } from '@/utils/cn'
import { formatNumber, formatPercent, formatRelative } from '@/utils/format'
import { AppIcon } from '@/components/ui/AppIcon'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { FunnelChart } from '@/components/charts/FunnelChart'

export function LiveVisitors() {
  const live = useLiveVisitors()
  return (
    <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-[13px] shadow-xs" aria-live="off">
      <span className="size-2 animate-pulse-dot rounded-full bg-success text-success" aria-hidden />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={live} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -6, opacity: 0 }} className="num font-semibold text-fg">
          {formatNumber(live)}
        </motion.span>
      </AnimatePresence>
      <span className="text-subtle">on site now</span>
    </span>
  )
}

export function FunnelCard({ scope, id }: { scope?: Scope; id?: string }) {
  const { range } = useDashboard()
  const { data, error, refetch } = useQuery(`analytics:funnel:${scope?.id ?? 'all'}:${rangeKeyOf(range)}`, () => analyticsService.funnel(range, scope), { keepPrevious: true })
  return (
    <Card id={id} className="h-full">
      <CardHeader title="Download funnel" description="Impressions → clicks → downloads" />
      <CardBody>{error ? <ErrorState error={error} onRetry={refetch} compact /> : <FunnelChart stages={data} />}</CardBody>
    </Card>
  )
}

export function TopApps({ limit = 6, id }: { limit?: number; id?: string }) {
  const { range } = useDashboard()
  const { data, error, refetch } = useQuery(`analytics:topApps:${limit}:${rangeKeyOf(range)}`, () => analyticsService.topApps(range, limit), { keepPrevious: true })
  const max = data?.[0]?.downloads ?? 1
  return (
    <Card id={id} className="h-full">
      <CardHeader title="Top performing apps" description="Ranked by attributed downloads" action={<Link to="/dashboard/apps" className="text-[13px] font-semibold text-accent-text hover:underline">All apps</Link>} />
      <CardBody className="px-3 sm:px-3">
        {error ? (
          <ErrorState error={error} onRetry={refetch} compact />
        ) : !data ? (
          <div className="space-y-2 px-3">{Array.from({ length: limit }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : (
          <ol>
            {data.map((r, i) => (
              <motion.li key={r.app.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/dashboard/apps/${r.app.id}`} className="group grid grid-cols-[22px_auto_1fr_auto] items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2">
                  <span className="num text-center font-display text-sm font-bold text-subtle">{i + 1}</span>
                  <AppIcon app={r.app} size="sm" />
                  <span className="min-w-0">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-fg">{r.app.name}</span>
                      <span className="num text-sm font-semibold text-fg">{formatNumber(r.downloads)}</span>
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
                        <motion.span className="block h-full rounded-full bg-[var(--chart-1)]" initial={{ width: 0 }} animate={{ width: `${(r.downloads / max) * 100}%` }} transition={{ duration: 0.8, delay: 0.1 + i * 0.05 }} />
                      </span>
                      <span className="num w-24 truncate text-right text-[11px] text-subtle">{r.clientName}</span>
                    </span>
                  </span>
                  <span className="flex w-20 flex-col items-end">
                    <span className="num text-xs font-medium text-muted">{formatPercent(r.conversion)} conv.</span>
                    <span className={cn('num inline-flex items-center gap-0.5 text-[11px] font-semibold', r.growth >= 0 ? 'text-success' : 'text-danger')}>
                      {r.growth >= 0 ? <TrendingUp className="size-3" aria-hidden /> : <TrendingDown className="size-3" aria-hidden />}
                      {r.growth >= 0 ? '+' : ''}{r.growth.toFixed(1)}%
                    </span>
                  </span>
                </Link>
              </motion.li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  )
}

const sevIcon = {
  critical: <CircleAlert className="size-4 text-danger" />,
  warning: <AlertTriangle className="size-4 text-warning" />,
  success: <CheckCircle2 className="size-4 text-success" />,
  info: <Activity className="size-4 text-info" />,
}

export function AlertsPanel() {
  const { data, error, refetch } = useQuery('notifications:list', () => notificationsService.list())
  const alerts = data?.filter((n) => n.severity === 'warning' || n.severity === 'critical' || n.kind === 'performance').slice(0, 4)
  return (
    <Card className="h-full">
      <CardHeader title="Performance alerts" description="Needs attention" action={<Link to="/dashboard/notifications" className="text-[13px] font-semibold text-accent-text hover:underline">View all</Link>} />
      <CardBody className="space-y-2">
        {error ? (
          <ErrorState error={error} onRetry={refetch} compact />
        ) : !alerts ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)
        ) : alerts.length === 0 ? (
          <EmptyState compact icon={<CheckCircle2 />} title="All clear" description="No campaigns need attention right now." />
        ) : (
          alerts.map((a) => (
            <Link key={a.id} to={a.href ?? '/dashboard/notifications'} className="flex gap-3 rounded-xl border border-line p-3 transition-colors hover:bg-surface-2">
              <span className="mt-0.5" aria-label={a.severity}>{sevIcon[a.severity]}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-semibold text-fg">{a.title}</span>
                  <span className="shrink-0 text-[11px] text-subtle">{formatRelative(a.createdAt)}</span>
                </span>
                <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{a.body}</span>
              </span>
            </Link>
          ))
        )}
      </CardBody>
    </Card>
  )
}

export function ActivityFeed() {
  const { data, error, refetch } = useQuery('analytics:activity', () => analyticsService.activity())
  return (
    <Card className="h-full">
      <CardHeader title="Recent activity" description="Changes across your workspace" />
      <CardBody>
        {error ? (
          <ErrorState error={error} onRetry={refetch} compact />
        ) : !data ? (
          <Skeleton className="h-48" />
        ) : (
          <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-line">
            {data.map((a) => (
              <li key={a.id} className="relative flex gap-3 pl-5">
                <span className="absolute left-0 top-1.5 size-[11px] rounded-full border-2 border-surface bg-line-strong" aria-hidden />
                <p className="text-[13px] leading-snug text-muted">
                  <span className="font-semibold text-fg">{a.actor}</span> {a.action}{' '}
                  {a.href ? <Link to={a.href} className="font-medium text-fg hover:text-accent-text hover:underline">{a.target}</Link> : <span className="font-medium text-fg">{a.target}</span>}
                  <span className="mt-0.5 block text-[11px] text-subtle">{formatRelative(a.at)}</span>
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  )
}

const statusStyle = {
  operational: { label: 'Operational', dot: 'bg-success', text: 'text-success' },
  degraded: { label: 'Degraded', dot: 'bg-warning', text: 'text-warning' },
  outage: { label: 'Outage', dot: 'bg-danger', text: 'text-danger' },
}

export function SystemHealth() {
  const { data, error, refetch } = useQuery('analytics:health', () => analyticsService.systemHealth())
  const degraded = data?.some((s) => s.status !== 'operational')
  return (
    <Card className="h-full">
      <CardHeader
        title="System health"
        description={data ? (degraded ? 'Some services are degraded' : 'All systems operational') : 'Checking…'}
        action={<Radio className={cn('size-4', degraded ? 'text-warning' : 'text-success')} aria-hidden />}
      />
      <CardBody>
        {error ? (
          <ErrorState error={error} onRetry={refetch} compact />
        ) : !data ? (
          <Skeleton className="h-40" />
        ) : (
          <ul className="divide-y divide-line">
            {data.map((s) => {
              const st = statusStyle[s.status]
              return (
                <li key={s.name} className="flex items-center gap-3 py-2.5 text-[13px] first:pt-0 last:pb-0">
                  <span className={cn('size-2 rounded-full', st.dot)} aria-hidden />
                  <span className="flex-1 text-fg">{s.name}</span>
                  <span className="num text-xs text-subtle">{s.latencyMs} ms</span>
                  <span className={cn('w-20 text-right text-xs font-medium', st.text)}>{st.label}</span>
                </li>
              )
            })}
          </ul>
        )}
        <Link to="/dashboard/settings?tab=integrations" className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-accent-text hover:underline">
          Tracking & integrations <ArrowRight className="size-3.5" />
        </Link>
      </CardBody>
    </Card>
  )
}
