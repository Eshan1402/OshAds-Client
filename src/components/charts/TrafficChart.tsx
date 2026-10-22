import { memo, useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useQuery } from '@/hooks/useQuery'
import { analyticsService, resolveRange, type Scope } from '@/services/analyticsService'
import type { MetricKey, RangeKey, TimePoint } from '@/types'
import { formatCompact, formatNumber, formatShortDate, pctChange } from '@/utils/format'
import { Card } from '@/components/ui/Card'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Delta } from '@/components/ui/Misc'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { cn } from '@/utils/cn'
import { axisProps, TooltipCard } from './ChartTooltip'

const metrics: Array<{ key: MetricKey; label: string }> = [
  { key: 'visitors', label: 'Visitors' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'clicks', label: 'Clicks' },
  { key: 'downloads', label: 'Downloads' },
]

const ranges: Array<{ value: RangeKey; label: string }> = [
  { value: 'today', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '3M' },
  { value: '1y', label: '1Y' },
]

/** Primary traffic chart: one metric at a time, with the previous period as a dashed reference. */
export const TrafficChart = memo(function TrafficChart({ scope, initialRange = '30d', title = 'Traffic overview' }: { scope?: Scope; initialRange?: RangeKey; title?: string }) {
  const [metric, setMetric] = useState<MetricKey>('visitors')
  const [rangeKey, setRangeKey] = useState<RangeKey>(initialRange)
  const range = resolveRange(rangeKey)
  const days = rangeKey === 'today' ? 1 : Math.round((new Date(range.to).getTime() - new Date(range.from).getTime()) / 864e5) + 1
  const prevRange = { key: rangeKey, from: shift(range.from, -days), to: shift(range.to, -days) }
  const scopeKey = scope ? `${scope.type}:${scope.id}` : 'all'
  const cur = useQuery(`analytics:series:${scopeKey}:${rangeKey}`, () => analyticsService.series(range, scope), { keepPrevious: true })
  const prev = useQuery(rangeKey === 'today' ? null : `analytics:series:${scopeKey}:${rangeKey}:prev`, () => analyticsService.series(prevRange, scope), { keepPrevious: true })

  const data = useMemo(
    () => cur.data?.map((p, i) => ({ ...p, prev: prev.data?.[i]?.[metric] })),
    [cur.data, prev.data, metric],
  )
  const total = sum(cur.data, metric)
  const prevTotal = sum(prev.data, metric)
  const hourly = rangeKey === 'today'

  return (
    <Card className="overflow-hidden">
      <div className="px-5 pt-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-[15px] font-semibold text-fg">{title}</h3>
          <div className="flex flex-wrap items-center gap-3">
            {!hourly && prev.data && cur.data && <Delta value={pctChange(total, prevTotal)} suffix=" vs prev." />}
            <SegmentedControl label="Time range" size="sm" value={rangeKey} onChange={setRangeKey} options={ranges} />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1 sm:grid-cols-4" role="tablist" aria-label="Metric">
          {metrics.map((m) => {
            const active = m.key === metric
            return (
              <button
                key={m.key}
                role="tab"
                aria-selected={active}
                onClick={() => setMetric(m.key)}
                className={cn(
                  'rounded-xl border px-3.5 py-2 text-left transition-all',
                  active ? 'border-accent/40 bg-accent-soft' : 'border-transparent hover:bg-surface-2',
                )}
              >
                <span className={cn('block text-xs font-medium', active ? 'text-accent-text' : 'text-subtle')}>{m.label}</span>
                <span className="num block font-display text-lg font-bold text-fg">{cur.data ? formatCompact(sum(cur.data, m.key)) : '—'}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="h-[300px] px-2 pb-3 pt-4 sm:px-4">
        {cur.error ? (
          <ErrorState title="Analytics unavailable" error={cur.error} onRetry={cur.refetch} compact />
        ) : !data ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="traffic-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis
                dataKey="date"
                {...axisProps}
                minTickGap={28}
                tickFormatter={(d: string) => (hourly ? new Date(d).toLocaleTimeString('en-US', { hour: 'numeric' }) : formatShortDate(d))}
              />
              <YAxis {...axisProps} width={44} tickFormatter={(v: number) => formatCompact(v)} />
              <Tooltip
                cursor={{ stroke: 'var(--line-strong)', strokeDasharray: '3 3' }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <TooltipCard
                      title={hourly ? new Date(label as string).toLocaleString('en-US', { weekday: 'short', hour: 'numeric' }) : formatShortDate(label as string)}
                      rows={[
                        { label: metrics.find((m) => m.key === metric)!.label, value: formatNumber((payload[0].payload as TimePoint)[metric]), color: 'var(--chart-1)' },
                        ...(!hourly && payload[0].payload.prev !== undefined ? [{ label: 'Previous period', value: formatNumber(payload[0].payload.prev), color: 'var(--subtle)', dashed: true }] : []),
                      ]}
                    />
                  ) : null
                }
              />
              {!hourly && <Line dataKey="prev" stroke="var(--subtle)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} activeDot={false} isAnimationActive={false} />}
              <Area
                type="monotone"
                dataKey={metric}
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#traffic-fill)"
                activeDot={{ r: 4.5, strokeWidth: 2, stroke: 'var(--surface)' }}
                animationDuration={700}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      {!hourly && (
        <div className="flex items-center gap-4 border-t border-line px-5 py-2.5 text-xs text-subtle sm:px-6">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded-full bg-[var(--chart-1)]" /> Current period</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded-full" style={{ backgroundImage: 'linear-gradient(90deg, var(--subtle) 50%, transparent 50%)', backgroundSize: '4px 2px' }} /> Previous period</span>
        </div>
      )}
    </Card>
  )
})

function sum(points: TimePoint[] | undefined, k: MetricKey) {
  return points?.reduce((s, p) => s + p[k], 0) ?? 0
}

function shift(iso: string, days: number) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
