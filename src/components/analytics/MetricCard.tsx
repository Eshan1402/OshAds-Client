import { motion } from 'framer-motion'
import { AppWindow, Download, Megaphone, MousePointerClick, Percent, Users } from 'lucide-react'
import { memo, type ReactNode } from 'react'
import { rangeKeyOf, useDashboard } from '@/context/DashboardContext'
import { useQuery } from '@/hooks/useQuery'
import { analyticsService, rangeLabel, type Scope } from '@/services/analyticsService'
import type { KpiSummary } from '@/types'
import { formatCurrency, formatNumber, formatPercent, pctChange } from '@/utils/format'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Delta, Sparkline } from '@/components/ui/Misc'

const icons: Record<string, ReactNode> = {
  visitors: <Users />,
  clicks: <MousePointerClick />,
  downloads: <Download />,
  conversion: <Percent />,
  campaigns: <Megaphone />,
  apps: <AppWindow />,
}

const fmt = (k: KpiSummary) => (n: number) =>
  k.format === 'percent' ? formatPercent(n) : k.format === 'currency' ? formatCurrency(n) : formatNumber(n)

export const MetricCard = memo(function MetricCard({ kpi, index = 0, comparisonLabel }: { kpi: KpiSummary; index?: number; comparisonLabel: string }) {
  const change = kpi.format === 'percent' ? kpi.value - kpi.previous : pctChange(kpi.value, kpi.previous)
  const isCount = kpi.key === 'campaigns' || kpi.key === 'apps'
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="card group relative flex flex-col overflow-hidden p-4 transition-shadow hover:shadow-md sm:p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted">{kpi.label}</span>
        <span className="grid size-8 place-items-center rounded-lg bg-surface-2 text-subtle transition-colors group-hover:bg-accent-soft group-hover:text-accent-text [&>svg]:size-4" aria-hidden>
          {icons[kpi.key]}
        </span>
      </div>
      <p className="num mt-3 font-display text-[26px] font-bold leading-none tracking-tight text-fg">
        <AnimatedCounter value={kpi.value} format={fmt(kpi)} />
      </p>
      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-subtle">
        {isCount ? (
          <span className="num">{kpi.value - kpi.previous >= 0 ? '+' : ''}{kpi.value - kpi.previous} {comparisonLabel}</span>
        ) : (
          <>
            <Delta value={change} suffix={kpi.format === 'percent' ? ' pts' : ''} />
            <span className="truncate">{comparisonLabel}</span>
          </>
        )}
      </div>
      <Sparkline data={kpi.spark} className="mt-3" color={change >= 0 ? 'var(--chart-1)' : 'var(--danger)'} />
    </motion.div>
  )
})

export function KpiGrid({ scope, only }: { scope?: Scope; only?: string[] }) {
  const { range } = useDashboard()
  const { data, error, refetch } = useQuery(`analytics:kpis:${scope?.id ?? 'all'}:${rangeKeyOf(range)}`, () => analyticsService.kpis(range, scope), { keepPrevious: true })
  const label = range.key === 'today' ? 'vs yesterday' : `vs previous ${range.key === 'custom' ? 'period' : rangeLabel[range.key].replace('Last ', '')}`
  const items = data?.filter((k) => !only || only.includes(k.key))
  if (error) return <div className="card"><ErrorState title="Metrics unavailable" error={error} onRetry={refetch} compact /></div>
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
      {items
        ? items.map((k, i) => <MetricCard key={k.key} kpi={k} index={i} comparisonLabel={k.key === 'campaigns' || k.key === 'apps' ? 'vs period start' : label} />)
        : Array.from({ length: only?.length ?? 6 }).map((_, i) => (
            <div key={i} className="card p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-4 h-7 w-28" />
              <Skeleton className="mt-3 h-4 w-20" />
              <Skeleton className="mt-3 h-9 w-full" />
            </div>
          ))}
    </div>
  )
}
