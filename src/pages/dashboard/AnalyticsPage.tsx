import { useEffect, useState, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { rangeKeyOf, useDashboard } from '@/context/DashboardContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { analyticsService } from '@/services/analyticsService'
import { clientsService } from '@/services/clientsService'
import { cn } from '@/utils/cn'
import { formatCompact, formatCurrencyPrecise, formatNumber, formatPercent, formatShortDate, safeDiv } from '@/utils/format'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { ProgressBar } from '@/components/ui/Misc'
import { KpiGrid } from '@/components/analytics/MetricCard'
import { DeviceBreakdown, GeoBreakdown, OsBreakdown, TrafficSources } from '@/components/analytics/Breakdowns'
import { FunnelCard, TopApps } from '@/components/analytics/Panels'
import { CampaignTable } from '@/components/campaigns/CampaignTable'
import { axisProps, TooltipCard } from '@/components/charts/ChartTooltip'
import { TrafficChart } from '@/components/charts/TrafficChart'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { ClientLogo } from './ClientsPage'

const sections = [
  ['traffic', 'Traffic overview'],
  ['sources', 'Acquisition'],
  ['engagement', 'Engagement'],
  ['downloads', 'Downloads'],
  ['conversion', 'Conversion'],
  ['campaigns', 'Campaigns'],
  ['clients', 'Clients'],
  ['apps', 'Applications'],
  ['geography', 'Geography'],
  ['devices', 'Devices & OS'],
] as const

export default function AnalyticsPage() {
  useDocumentTitle('Analytics')
  const [active, setActive] = useState<string>('traffic')

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-30% 0px -60% 0px' },
    )
    sections.forEach(([id]) => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])

  return (
    <div>
      <PageHeader title="Analytics" description="Every metric across owned traffic, campaigns, clients and apps." actions={<DateRangePicker />} />
      <div className="sticky top-16 z-20 -mx-4 mb-6 border-b border-line bg-bg/90 px-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <nav aria-label="Analytics sections" className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
          {sections.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); history.replaceState(null, '', `#${id}`) }}
              className={cn('shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors', active === id ? 'bg-accent-soft text-accent-text' : 'text-subtle hover:bg-surface-2 hover:text-fg')}>
              {label}
            </a>
          ))}
        </nav>
      </div>
      <div className="space-y-10">
        <Section id="traffic" title="Traffic overview">
          <div className="space-y-6"><KpiGrid /><TrafficChart initialRange="90d" /></div>
        </Section>
        <Section id="sources" title="Acquisition"><TrafficSources /></Section>
        <Section id="engagement" title="Engagement"><Engagement /></Section>
        <Section id="downloads" title="Downloads"><DownloadsChart /></Section>
        <Section id="conversion" title="Conversion">
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]"><ConversionChart /><FunnelCard /></div>
        </Section>
        <Section id="campaigns" title="Campaign performance">
          <Card className="overflow-hidden"><CampaignTable pageSize={8} /></Card>
        </Section>
        <Section id="clients" title="Client performance"><ClientPerformance /></Section>
        <Section id="apps" title="Application performance"><TopApps limit={10} /></Section>
        <Section id="geography" title="Geography"><GeoBreakdown /></Section>
        <Section id="devices" title="Devices & operating systems">
          <div className="grid gap-6 lg:grid-cols-2"><DeviceBreakdown /><OsBreakdown /></div>
        </Section>
      </div>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-32">
      <h2 id={`${id}-h`} className="mb-4 font-display text-lg font-bold text-fg">{title}</h2>
      {children}
    </section>
  )
}

function useSeries() {
  const { range } = useDashboard()
  return useQuery(`analytics:series:all:${rangeKeyOf(range)}`, () => analyticsService.series(range), { keepPrevious: true })
}

function Engagement() {
  const { range } = useDashboard()
  const { data, error, refetch } = useQuery(`analytics:totals:${rangeKeyOf(range)}`, () => analyticsService.totals(range), { keepPrevious: true })
  if (error) return <Card><ErrorState error={error} onRetry={refetch} compact /></Card>
  const stats = data
    ? [
        ['Sessions per visitor', safeDiv(data.sessions, data.visitors).toFixed(2), 'Average across all traffic'],
        ['App cards viewed / session', safeDiv(data.impressions, data.sessions).toFixed(1), 'Impressions per session'],
        ['Click-through rate', formatPercent(safeDiv(data.clicks, data.impressions) * 100), 'Clicks ÷ impressions'],
        ['Revenue per visitor', formatCurrencyPrecise(safeDiv(data.revenue, data.visitors)), 'Reward-weighted revenue'],
      ]
    : null
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats
          ? stats.map(([k, v, d]) => (
              <div key={k} className="card p-5">
                <p className="text-[13px] text-muted">{k}</p>
                <p className="num mt-2 font-display text-2xl font-bold text-fg">{v}</p>
                <p className="mt-1 text-xs text-subtle">{d}</p>
              </div>
            ))
          : Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <EngagementDetail />
    </div>
  )
}

/** Time, scroll, returning visitors and what people used on the site, from the new engagement events. */
function EngagementDetail() {
  const { range } = useDashboard()
  const { data } = useQuery(`analytics:engagement:${rangeKeyOf(range)}`, () => analyticsService.engagement(range), { keepPrevious: true })
  if (!data) return <Skeleton className="h-40 rounded-2xl" />
  const minutes = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`)
  const cards: Array<[string, string, string]> = [
    ['Avg. time on page', minutes(data.avgSeconds), 'While the tab was visible'],
    ['Avg. scroll depth', `${data.avgScroll}%`, 'How far down pages people read'],
    ['Returning visitors', formatNumber(data.returning), data.consented ? `${formatPercent(safeDiv(data.returning, data.consented) * 100)} of ${formatNumber(data.consented)} who accepted cookies` : 'Counts visitors who accepted cookies'],
    ['Website & LinkedIn clicks', formatNumber(data.outbound.reduce((a, o) => a + o.count, 0)), data.outbound.map((o) => `${o.label} ${o.count}`).join(' · ') || 'From app pages'],
  ]
  const lists: Array<[string, Array<{ label: string; count: number }>, string]> = [
    ['Games started', data.games, 'No games played yet'],
    ['Top searches', data.searches, 'No searches yet'],
    ['Category filters', data.filters, 'No filters used yet'],
  ]
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([k, v, d]) => (
          <div key={k} className="card p-5">
            <p className="text-[13px] text-muted">{k}</p>
            <p className="num mt-2 font-display text-2xl font-bold text-fg">{v}</p>
            <p className="mt-1 truncate text-xs text-subtle">{d}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {lists.map(([title, rows, empty]) => (
          <div key={title} className="card p-5">
            <p className="text-[13px] font-medium text-fg">{title}</p>
            {rows.length ? (
              <ul className="mt-3 space-y-1.5 text-[13px]">
                {rows.map((r) => (
                  <li key={r.label} className="flex justify-between gap-3">
                    <span className="truncate text-muted">{r.label}</span>
                    <span className="num font-semibold text-fg">{formatNumber(r.count)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-subtle">{empty}</p>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

function DownloadsChart() {
  const { data, error, refetch } = useSeries()
  return (
    <Card>
      <CardHeader title="Downloads per day" description="Attributed installs from owned traffic" />
      <CardBody className="h-72">
        {error ? <ErrorState error={error} onRetry={refetch} compact /> : !data ? <Skeleton className="h-full" /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="18%">
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="date" {...axisProps} minTickGap={24} tickFormatter={(d: string) => (data.length <= 1 ? '' : formatShortDate(d))} />
              <YAxis {...axisProps} width={40} tickFormatter={(v: number) => formatCompact(v)} />
              <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={({ active, payload, label }) => active && payload?.length ? <TooltipCard title={formatShortDate(label as string)} rows={[{ label: 'Downloads', value: formatNumber(payload[0].value as number), color: 'var(--chart-1)' }]} /> : null} />
              <Bar dataKey="downloads" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardBody>
    </Card>
  )
}

function ConversionChart() {
  const { data, error, refetch } = useSeries()
  const rows = data?.map((p) => ({ date: p.date, conv: safeDiv(p.downloads, p.clicks) * 100 }))
  return (
    <Card>
      <CardHeader title="Conversion rate" description="Downloads ÷ clicks, per day" />
      <CardBody className="h-72">
        {error ? <ErrorState error={error} onRetry={refetch} compact /> : !rows ? <Skeleton className="h-full" /> : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="date" {...axisProps} minTickGap={24} tickFormatter={(d: string) => formatShortDate(d)} />
              <YAxis {...axisProps} width={40} domain={['dataMin - 2', 'dataMax + 2']} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
              <Tooltip cursor={{ stroke: 'var(--line-strong)', strokeDasharray: '3 3' }} content={({ active, payload, label }) => active && payload?.length ? <TooltipCard title={formatShortDate(label as string)} rows={[{ label: 'Conversion', value: formatPercent(payload[0].value as number), color: 'var(--chart-2)' }]} /> : null} />
              <Line dataKey="conv" stroke="var(--chart-2)" strokeWidth={2} dot={false} activeDot={{ r: 4.5, strokeWidth: 2, stroke: 'var(--surface)' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardBody>
    </Card>
  )
}

function ClientPerformance() {
  const { data, error, refetch } = useQuery('clients:list', () => clientsService.list())
  const rows = data?.slice().sort((a, b) => b.downloads - a.downloads)
  const max = rows?.[0]?.downloads ?? 1
  return (
    <Card>
      <CardBody className="pt-5">
        {error ? <ErrorState error={error} onRetry={refetch} compact /> : !rows ? <Skeleton className="h-64" /> : (
          <ul className="space-y-3">
            {rows.map((c) => (
              <li key={c.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:grid-cols-[auto_180px_1fr_100px_80px]">
                <ClientLogo client={c} size="sm" />
                <span className="truncate text-[13px] font-semibold text-fg">{c.name}</span>
                <span className="hidden sm:block"><ProgressBar value={c.downloads} max={max} label={`${c.name} downloads`} /></span>
                <span className="num text-right text-[13px] font-semibold text-fg">{formatCompact(c.downloads)}</span>
                <span className="num hidden text-right text-xs text-subtle sm:block">{formatPercent(c.conversion)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
