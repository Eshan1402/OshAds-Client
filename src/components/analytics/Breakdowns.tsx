import { motion } from 'framer-motion'
import { ChevronRight, Monitor, Smartphone, Tablet } from 'lucide-react'
import { Fragment, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { rangeKeyOf, useDashboard } from '@/context/DashboardContext'
import { useQuery } from '@/hooks/useQuery'
import { analyticsService } from '@/services/analyticsService'
import type { GeoCountry } from '@/types'
import { cn } from '@/utils/cn'
import { formatCompact, formatNumber, formatPercent, safeDiv } from '@/utils/format'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Delta } from '@/components/ui/Misc'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { axisProps, chartColors, otherColor, TooltipCard } from '@/components/charts/ChartTooltip'
import { DonutChart, Legend } from '@/components/charts/DonutChart'

function useRangeQuery<T>(name: string, fn: (r: ReturnType<typeof useDashboard>['range']) => Promise<T>) {
  const { range } = useDashboard()
  return useQuery(`analytics:${name}:${rangeKeyOf(range)}`, () => fn(range), { keepPrevious: true })
}

export function TrafficSources({ id }: { id?: string }) {
  const { data, error, refetch } = useRangeQuery('sources', analyticsService.sources)
  const [view, setView] = useState<'share' | 'bars'>('share')
  const colorFor = (i: number, name: string) => (name === 'Other' ? otherColor : chartColors[i % chartColors.length])
  const total = data?.reduce((s, d) => s + d.visitors, 0) ?? 0
  return (
    <Card id={id}>
      <CardHeader
        title="Traffic sources"
        description="Where visitors arrive from, and how well each source converts"
        action={<SegmentedControl label="Chart type" size="sm" value={view} onChange={setView} options={[{ value: 'share', label: 'Share' }, { value: 'bars', label: 'Downloads' }]} />}
      />
      <CardBody>
        {error ? (
          <ErrorState error={error} onRetry={refetch} compact />
        ) : !data ? (
          <Skeleton className="h-60 w-full" />
        ) : view === 'share' ? (
          <div className="grid items-center gap-6 sm:grid-cols-[200px_1fr]">
            <DonutChart data={data.map((d, i) => ({ name: d.source, value: d.visitors, color: colorFor(i, d.source) }))} centerLabel="visitors" centerValue={formatCompact(total)} />
            <ul className="space-y-2.5">
              {data.map((d, i) => (
                <li key={d.source} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-[13px]">
                  <span className="flex items-center gap-2 text-muted">
                    <span className="size-2.5 rounded-[3px]" style={{ background: colorFor(i, d.source) }} aria-hidden />
                    {d.source}
                  </span>
                  <span className="num font-semibold text-fg">{formatPercent(d.share * 100, 0)}</span>
                  <Delta value={d.change} className="w-[68px] justify-center" />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }} barCategoryGap={6}>
                <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
                <XAxis type="number" {...axisProps} tickFormatter={(v: number) => formatCompact(v)} />
                <YAxis type="category" dataKey="source" {...axisProps} width={104} />
                <Tooltip
                  cursor={{ fill: 'var(--surface-2)' }}
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <TooltipCard
                        title={payload[0].payload.source}
                        rows={[
                          { label: 'Downloads', value: formatNumber(payload[0].payload.downloads), color: 'var(--chart-1)' },
                          { label: 'Visit → download', value: formatPercent(safeDiv(payload[0].payload.downloads, payload[0].payload.visitors) * 100) },
                        ]}
                      />
                    ) : null
                  }
                />
                <Bar dataKey="downloads" fill="var(--chart-1)" radius={[0, 4, 4, 0]} maxBarSize={18} animationDuration={700} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export function GeoBreakdown({ id }: { id?: string }) {
  const { data, error, refetch } = useRangeQuery('geo', analyticsService.geography)
  const [open, setOpen] = useState<string | null>('US')
  const [openRegion, setOpenRegion] = useState<string | null>(null)
  const max = data ? Math.max(...data.map((c) => c.visitors)) : 1
  return (
    <Card id={id}>
      <CardHeader title="Geographic distribution" description="Country → state/region → city. Select a row to drill down." />
      <CardBody className="px-0 pb-2 sm:px-0">
        {error ? (
          <ErrorState error={error} onRetry={refetch} compact />
        ) : !data ? (
          <div className="space-y-2 px-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead>
                <tr className="border-y border-line bg-surface-2/50 text-left text-xs text-subtle">
                  <th className="px-6 py-2 font-medium">Location</th>
                  <th className="px-3 py-2 font-medium">Share of visitors</th>
                  <th className="px-3 py-2 text-right font-medium">Visitors</th>
                  <th className="px-3 py-2 text-right font-medium">Downloads</th>
                  <th className="px-6 py-2 text-right font-medium">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <GeoRows key={c.code} country={c} max={max} open={open === c.code} onToggle={() => setOpen(open === c.code ? null : c.code)} openRegion={openRegion} onRegion={setOpenRegion} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

function GeoRows({ country, max, open, onToggle, openRegion, onRegion }: { country: GeoCountry; max: number; open: boolean; onToggle: () => void; openRegion: string | null; onRegion: (r: string | null) => void }) {
  const conv = (d: number, v: number) => formatPercent(safeDiv(d, v) * 100)
  return (
    <>
      <tr className="border-b border-line transition-colors hover:bg-surface-2/60">
        <td className="px-6 py-2.5">
          <button onClick={onToggle} aria-expanded={open} className="flex items-center gap-2 font-medium text-fg">
            <ChevronRight className={cn('size-3.5 text-subtle transition-transform', open && 'rotate-90')} aria-hidden />
            <span aria-hidden>{country.flag}</span>
            {country.name}
          </button>
        </td>
        <td className="px-3 py-2.5">
          <div className="h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-surface-3">
            <motion.div className="h-full rounded-full bg-[var(--chart-1)]" initial={{ width: 0 }} animate={{ width: `${(country.visitors / max) * 100}%` }} transition={{ duration: 0.7 }} />
          </div>
        </td>
        <td className="num px-3 py-2.5 text-right text-fg">{formatNumber(country.visitors)}</td>
        <td className="num px-3 py-2.5 text-right text-fg">{formatNumber(country.downloads)}</td>
        <td className="num px-6 py-2.5 text-right text-muted">{conv(country.downloads, country.visitors)}</td>
      </tr>
      {open &&
        country.regions.map((r) => {
          const key = `${country.code}:${r.name}`
          const rOpen = openRegion === key
          return (
            <Fragment key={key}>
              <tr className="border-b border-line bg-surface-2/30">
                <td className="py-2 pl-12 pr-3">
                  <button onClick={() => onRegion(rOpen ? null : key)} aria-expanded={rOpen} className="flex items-center gap-2 text-muted hover:text-fg">
                    <ChevronRight className={cn('size-3 transition-transform', rOpen && 'rotate-90')} aria-hidden />
                    {r.name}
                  </button>
                </td>
                <td />
                <td className="num px-3 py-2 text-right text-muted">{formatNumber(r.visitors)}</td>
                <td className="num px-3 py-2 text-right text-muted">{formatNumber(r.downloads)}</td>
                <td className="num px-6 py-2 text-right text-subtle">{conv(r.downloads, r.visitors)}</td>
              </tr>
              {rOpen &&
                r.cities.map((city) => (
                  <tr key={city.name} className="border-b border-line bg-surface-2/50 text-subtle">
                    <td className="py-1.5 pl-20 pr-3">{city.name}</td>
                    <td />
                    <td className="num px-3 py-1.5 text-right">{formatNumber(city.visitors)}</td>
                    <td className="num px-3 py-1.5 text-right">{formatNumber(city.downloads)}</td>
                    <td className="num px-6 py-1.5 text-right">{conv(city.downloads, city.visitors)}</td>
                  </tr>
                ))}
            </Fragment>
          )
        })}
    </>
  )
}

const deviceIcons = { Android: Smartphone, iOS: Smartphone, Desktop: Monitor, Tablet: Tablet }

export function DeviceBreakdown({ id }: { id?: string }) {
  const { data, error, refetch } = useRangeQuery('devices', analyticsService.devices)
  return (
    <Card id={id}>
      <CardHeader title="Devices" description="Users, downloads and conversion by device" />
      <CardBody>
        {error ? (
          <ErrorState error={error} onRetry={refetch} compact />
        ) : !data ? (
          <Skeleton className="h-56" />
        ) : (
          <>
            <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={data.map((d) => `${d.device} ${Math.round(d.share * 100)}%`).join(', ')}>
              {data.map((d, i) => (
                <motion.span key={d.device} className="h-full first:rounded-l-full last:rounded-r-full" style={{ background: chartColors[i] }} initial={{ width: 0 }} animate={{ width: `${d.share * 100}%` }} transition={{ duration: 0.8, delay: i * 0.06 }} />
              ))}
            </div>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {data.map((d, i) => {
                const Icon = deviceIcons[d.device]
                return (
                  <div key={d.device} className="rounded-xl border border-line p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-[3px]" style={{ background: chartColors[i] }} aria-hidden />
                      <Icon className="size-3.5 text-subtle" aria-hidden />
                      <span className="text-[13px] font-medium text-fg">{d.device}</span>
                      <span className="num ml-auto font-display text-base font-bold text-fg">{formatPercent(d.share * 100, 0)}</span>
                    </div>
                    <dl className="num mt-2.5 grid grid-cols-3 gap-2 text-[11px] [&_dt]:truncate">
                      <div><dt className="text-subtle">Users</dt><dd className="font-semibold text-fg">{formatCompact(d.users)}</dd></div>
                      <div><dt className="text-subtle">Downloads</dt><dd className="font-semibold text-fg">{formatCompact(d.downloads)}</dd></div>
                      <div><dt className="text-subtle">Conv.</dt><dd className="font-semibold text-fg">{formatPercent(safeDiv(d.downloads, d.users * 0.34) * 100, 0)}</dd></div>
                    </dl>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  )
}

export function OsBreakdown({ id }: { id?: string }) {
  const { data, error, refetch } = useRangeQuery('os', analyticsService.operatingSystems)
  const color = (name: string) => (name.startsWith('Android') ? 'var(--chart-3)' : name.startsWith('iOS') ? 'var(--chart-2)' : otherColor)
  return (
    <Card id={id}>
      <CardHeader title="Operating systems" description="OS version share across visitors" />
      <CardBody>
        {error ? (
          <ErrorState error={error} onRetry={refetch} compact />
        ) : !data ? (
          <Skeleton className="h-56" />
        ) : (
          <>
            <ul className="space-y-3">
              {data.map((o, i) => (
                <li key={o.name}>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted">{o.name}</span>
                    <span className="num font-semibold text-fg">{formatPercent(o.share * 100, 0)} <span className="font-normal text-subtle">· {formatCompact(o.users)}</span></span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <motion.div className="h-full rounded-full" style={{ background: color(o.name) }} initial={{ width: 0 }} animate={{ width: `${(o.share / Math.max(...data.map((x) => x.share))) * 100}%` }} transition={{ duration: 0.7, delay: i * 0.04 }} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-line pt-3">
              <Legend items={[{ name: 'Android', color: 'var(--chart-3)' }, { name: 'iOS', color: 'var(--chart-2)' }, { name: 'Other / desktop', color: otherColor }]} />
            </div>
          </>
        )}
      </CardBody>
    </Card>
  )
}
