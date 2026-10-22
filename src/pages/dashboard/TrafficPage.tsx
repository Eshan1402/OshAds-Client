import { useSearchParams } from 'react-router-dom'
import { rangeKeyOf, useDashboard } from '@/context/DashboardContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { analyticsService } from '@/services/analyticsService'
import { formatNumber, formatPercent, safeDiv } from '@/utils/format'
import { Card, CardHeader } from '@/components/ui/Card'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Delta, ProgressBar } from '@/components/ui/Misc'
import { Tabs } from '@/components/ui/SegmentedControl'
import { TrafficSources } from '@/components/analytics/Breakdowns'
import { TrafficChart } from '@/components/charts/TrafficChart'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { PageTransition } from '@/components/layout/PageTransition'

type View = 'sources' | 'referral' | 'organic'

export default function TrafficPage() {
  useDocumentTitle('Traffic')
  const [params, setParams] = useSearchParams()
  const view = (params.get('view') as View | null) ?? 'sources'
  return (
    <PageTransition>
      <PageHeader title="Traffic" description="Understand where your owned traffic comes from and which channels convert." actions={<DateRangePicker />} />
      <Tabs className="mb-6" value={view} onChange={(v) => setParams({ view: v })} tabs={[{ value: 'sources', label: 'Traffic sources' }, { value: 'referral', label: 'Referral sources' }, { value: 'organic', label: 'Organic traffic' }]} />
      {view === 'sources' && (
        <div className="space-y-6">
          <MeasuredTraffic />
          <TrafficChart title="Visitors over time" />
          <TrafficSources />
        </div>
      )}
      {view === 'referral' && <Referrals />}
      {view === 'organic' && <Organic />}
    </PageTransition>
  )
}

/** Real counts from the events server; the charts below are still sample data. */
function MeasuredTraffic() {
  const { range } = useDashboard()
  const { data, error, refetch } = useQuery(`analytics:measured:${rangeKeyOf(range)}`, () => analyticsService.measured(range))
  const tiles = data
    ? [
        { label: 'Visitors', value: data.visitors, hint: 'Unique per day, bots excluded' },
        { label: 'Page views', value: data.pageViews, hint: 'Public pages only' },
        { label: 'App page opens', value: data.appViews, hint: 'Clicks through to an app' },
        { label: 'Download clicks', value: data.downloadClicks, hint: `${formatPercent(safeDiv(data.downloadClicks, data.appViews) * 100)} of app opens` },
      ]
    : []
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Measured traffic" description="Real visitors and clicks recorded on the public site. Store installs need store or SDK data." className="pb-4" />
      {error ? <ErrorState error={error} onRetry={refetch} /> : !data ? <div className="p-6"><Skeleton className="h-24" /></div> : (
        <div className="space-y-5 border-t border-line p-5">
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {tiles.map((t) => (
              <div key={t.label}>
                <dt className="text-xs text-subtle">{t.label}</dt>
                <dd className="num mt-1 text-2xl font-semibold text-fg">{formatNumber(t.value)}</dd>
                <dd className="mt-0.5 text-xs text-muted">{t.hint}</dd>
              </div>
            ))}
          </dl>
          {data.apps.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-[13px]">
                <thead><tr className="border-b border-line text-left text-xs text-subtle"><th className="py-2 font-medium">App</th><th className="px-3 py-2 text-right font-medium">Page opens</th><th className="py-2 text-right font-medium">Download clicks</th></tr></thead>
                <tbody>
                  {data.apps.map((a) => (
                    <tr key={a.appId} className="border-b border-line last:border-0">
                      <td className="py-2 font-medium text-fg">{a.name}</td>
                      <td className="num px-3 py-2 text-right text-fg">{formatNumber(a.views)}</td>
                      <td className="num py-2 text-right text-fg">{formatNumber(a.downloads)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data.sources.length > 0 && (
            <p className="text-xs text-muted">Top sources: {data.sources.map((s) => `${s.source} (${formatNumber(s.visitors)})`).join(' · ')}</p>
          )}
        </div>
      )}
    </Card>
  )
}

function Referrals() {
  const { data, error, refetch } = useQuery('analytics:referrals', () => analyticsService.referralDomains())
  const max = Math.max(1, ...(data?.map((d) => d.visitors) ?? [1]))
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Referring domains" description="Sites sending visitors to OshAds" className="pb-4" />
      {error ? <ErrorState error={error} onRetry={refetch} /> : !data ? <div className="p-6"><Skeleton className="h-64" /></div> : (
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead><tr className="border-b border-line text-left text-xs text-subtle"><th className="px-5 py-2.5 font-medium">Domain</th><th className="px-3 py-2.5 font-medium">Share</th><th className="px-3 py-2.5 text-right font-medium">Visitors</th><th className="px-3 py-2.5 text-right font-medium">Downloads</th><th className="px-3 py-2.5 text-right font-medium">Conv.</th><th className="px-5 py-2.5 text-right font-medium">Change</th></tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.domain} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                  <td className="px-5 py-2.5 font-medium text-fg">
                    <span className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-md bg-surface-2 text-[10px] font-bold uppercase text-muted" aria-hidden>{r.domain[0]}</span>{r.domain}</span>
                  </td>
                  <td className="w-40 px-3 py-2.5"><ProgressBar value={r.visitors} max={max} label={`${r.domain} share`} /></td>
                  <td className="num px-3 py-2.5 text-right text-fg">{formatNumber(r.visitors)}</td>
                  <td className="num px-3 py-2.5 text-right text-fg">{formatNumber(r.downloads)}</td>
                  <td className="num px-3 py-2.5 text-right text-muted">{formatPercent(safeDiv(r.downloads, r.visitors) * 100)}</td>
                  <td className="px-5 py-2.5 text-right"><Delta value={r.change} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function Organic() {
  const { data, error, refetch } = useQuery('analytics:keywords', () => analyticsService.organicKeywords())
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader title="Top organic keywords" description="Search queries landing on OshAds app pages" className="pb-4" />
        {error ? <ErrorState error={error} onRetry={refetch} /> : !data ? <div className="p-6"><Skeleton className="h-64" /></div> : (
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead><tr className="border-b border-line text-left text-xs text-subtle"><th className="px-5 py-2.5 font-medium">Keyword</th><th className="px-3 py-2.5 text-right font-medium">Clicks</th><th className="px-3 py-2.5 text-right font-medium">Avg. position</th><th className="px-5 py-2.5 text-right font-medium">Position change</th></tr></thead>
              <tbody>
                {data.map((k) => (
                  <tr key={k.keyword} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                    <td className="px-5 py-2.5 font-medium text-fg">{k.keyword}</td>
                    <td className="num px-3 py-2.5 text-right text-fg">{formatNumber(k.clicks)}</td>
                    <td className="num px-3 py-2.5 text-right text-muted">{k.position.toFixed(1)}</td>
                    <td className="px-5 py-2.5 text-right"><span className={`num text-xs font-semibold ${k.change >= 0 ? 'text-success' : 'text-danger'}`}>{k.change >= 0 ? '▲' : '▼'} {Math.abs(k.change).toFixed(1)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
