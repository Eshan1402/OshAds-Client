import { CalendarClock, Download, FileBarChart, FileSpreadsheet, FileText, Printer, Table2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { campaignsService } from '@/services/campaignsService'
import { clientsService } from '@/services/clientsService'
import { queryClient } from '@/services/queryClient'
import { rangeLabel, resolveRange } from '@/services/analyticsService'
import { reportsService, reportTypeLabels } from '@/services/reportsService'
import type { RangeKey, ReportType } from '@/types'
import { cn } from '@/utils/cn'
import { toCSV, downloadFile } from '@/utils/csv'
import { formatDate, formatNumber, formatRelative } from '@/utils/format'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Field, Input, Select } from '@/components/ui/Form'
import { LogoMark } from '@/components/ui/Logo'
import { Pagination } from '@/components/ui/Misc'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { PageTransition } from '@/components/layout/PageTransition'

const types: Array<{ value: ReportType; icon: React.ReactNode; desc: string }> = [
  { value: 'campaign', icon: <FileBarChart />, desc: 'Delivery, CTR, conversion and spend per campaign' },
  { value: 'client', icon: <FileText />, desc: 'Spend, downloads and revenue by client' },
  { value: 'application', icon: <Table2 />, desc: 'Clicks, downloads and conversion per app' },
  { value: 'traffic', icon: <FileSpreadsheet />, desc: 'Daily visitors, sessions, impressions, clicks' },
  { value: 'downloads', icon: <Download />, desc: 'Daily downloads, conversion and revenue' },
]

const PAGE = 12

export default function ReportsPage() {
  useDocumentTitle('Reports')
  const { session } = useAuth()
  const toast = useToast()
  const [params] = useSearchParams()
  const [type, setType] = useState<ReportType>((params.get('type') as ReportType) ?? 'campaign')
  const [rangeKey, setRangeKey] = useState<RangeKey>('30d')
  const [from, setFrom] = useState(resolveRange('30d').from)
  const [to, setTo] = useState(resolveRange('30d').to)
  const [clientId, setClientId] = useState(params.get('client') ?? '')
  const [campaignId, setCampaignId] = useState('')
  const [page, setPage] = useState(1)
  const range = rangeKey === 'custom' ? resolveRange('custom', { from, to }) : resolveRange(rangeKey)
  const clients = useQuery('clients:list', () => clientsService.list())
  const camps = useQuery(`campaigns:list:all:${clientId}::`, () => campaignsService.list({ clientId: clientId || undefined }))
  const key = `reports:preview:${type}:${range.from}:${range.to}:${clientId}:${campaignId}`
  const preview = useQuery(key, () => reportsService.generate({ type, range, clientId: clientId || undefined, campaignId: campaignId || undefined }), { keepPrevious: true })
  const saved = useQuery('reports:list', () => reportsService.list())
  const rows = preview.data ?? []
  const cols = rows[0] ? Object.keys(rows[0]) : []
  const pageRows = rows.slice((page - 1) * PAGE, page * PAGE)
  const filename = useMemo(() => `oshads-${type}-report-${range.from}_${range.to}`, [type, range.from, range.to])
  const usesCampaignFilter = type === 'campaign'
  const usesClientFilter = type === 'campaign' || type === 'client' || type === 'application'
  const invalidRange = rangeKey === 'custom' && from > to

  const record = async (format: 'CSV' | 'PDF') => {
    await reportsService.save({ name: `${reportTypeLabels[type]} — ${rangeKey === 'custom' ? `${formatDate(from)} – ${formatDate(to)}` : rangeLabel[rangeKey]}`, type, range: rangeKey === 'custom' ? 'Custom' : rangeLabel[rangeKey], createdBy: session!.user.name, format })
    queryClient.invalidate('reports:list')
  }

  const exportCsv = async () => {
    if (!rows.length) return
    downloadFile(`${filename}.csv`, toCSV(rows))
    toast({ tone: 'success', title: 'CSV exported', description: `${rows.length} rows · ${filename}.csv` })
    await record('CSV')
  }
  const exportPdf = async () => {
    toast({ tone: 'info', title: 'Preparing PDF', description: 'Use “Save as PDF” in the print dialog.' })
    await record('PDF')
    setTimeout(() => window.print(), 300)
  }

  return (
    <PageTransition>
      <div className="no-print">
        <PageHeader title="Reports" description="Build, preview and export performance reports for your team and clients." />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="no-print space-y-6">
          <Card>
            <CardHeader title="Report type" />
            <CardBody className="space-y-1.5" role="radiogroup" aria-label="Report type">
              {types.map((t) => (
                <button key={t.value} role="radio" aria-checked={type === t.value} onClick={() => { setType(t.value); setPage(1) }}
                  className={cn('flex w-full items-start gap-3 rounded-xl border p-3 text-left transition', type === t.value ? 'border-accent bg-accent-soft/60 ring-1 ring-accent' : 'border-line hover:bg-surface-2')}>
                  <span className={cn('mt-0.5 [&>svg]:size-4', type === t.value ? 'text-accent-text' : 'text-subtle')}>{t.icon}</span>
                  <span><span className="block text-sm font-semibold text-fg">{reportTypeLabels[t.value]}</span><span className="block text-xs text-subtle">{t.desc}</span></span>
                </button>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Filters" />
            <CardBody className="space-y-4">
              <Field label="Date range">
                {({ id }) => (
                  <Select id={id} value={rangeKey} onChange={(e) => { setRangeKey(e.target.value as RangeKey); setPage(1) }}>
                    {(['7d', '30d', '90d', '1y', 'custom'] as RangeKey[]).map((k) => <option key={k} value={k}>{rangeLabel[k]}</option>)}
                  </Select>
                )}
              </Field>
              {rangeKey === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <Field label="From">{({ id }) => <Input id={id} type="date" inputSize="sm" value={from} onChange={(e) => setFrom(e.target.value)} />}</Field>
                  <Field label="To" error={invalidRange ? 'Must be after start' : undefined}>{({ id, invalid }) => <Input id={id} type="date" inputSize="sm" invalid={invalid} value={to} onChange={(e) => setTo(e.target.value)} />}</Field>
                </div>
              )}
              {usesClientFilter && (
                <Field label="Client">
                  {({ id }) => (
                    <Select id={id} value={clientId} onChange={(e) => { setClientId(e.target.value); setCampaignId(''); setPage(1) }}>
                      <option value="">All clients</option>
                      {clients.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                  )}
                </Field>
              )}
              {usesCampaignFilter && (
                <Field label="Campaign">
                  {({ id }) => (
                    <Select id={id} value={campaignId} onChange={(e) => { setCampaignId(e.target.value); setPage(1) }}>
                      <option value="">All campaigns</option>
                      {camps.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                  )}
                </Field>
              )}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" leftIcon={<FileSpreadsheet className="size-4" />} onClick={exportCsv} disabled={!rows.length || invalidRange}>Export CSV</Button>
                <Button leftIcon={<Printer className="size-4" />} onClick={exportPdf} disabled={!rows.length || invalidRange}>Export PDF</Button>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="print-area overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <LogoMark className="size-9" />
                <div>
                  <h2 className="font-display text-base font-bold text-fg">{reportTypeLabels[type]}</h2>
                  <p className="text-xs text-subtle">
                    {formatDate(range.from)} – {formatDate(range.to)}
                    {clientId && clients.data && ` · ${clients.data.find((c) => c.id === clientId)?.name}`}
                    {' · '}Generated {new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
              <Badge tone="neutral"><span className="num">{rows.length} rows</span></Badge>
            </div>
            {preview.error ? (
              <ErrorState error={preview.error} onRetry={preview.refetch} />
            ) : !preview.data ? (
              <div className="p-6"><Skeleton className="h-72" /></div>
            ) : rows.length === 0 ? (
              <EmptyState icon={<FileBarChart />} title="No data for these filters" description="Try widening the date range or clearing the client and campaign filters." />
            ) : (
              <>
                <div tabIndex={0} role="region" aria-label="Report preview table" className={cn('overflow-x-auto transition-opacity', preview.loading && 'opacity-60')}>
                  <table className="w-full min-w-[640px] text-[13px]">
                    <thead><tr className="border-b border-line bg-surface-2/50 text-left text-xs text-subtle">{cols.map((c, i) => <th key={c} className={cn('whitespace-nowrap px-3 py-2.5 font-medium first:pl-5 last:pr-5', i > 0 && typeof rows[0][c] === 'number' && 'text-right')}>{c}</th>)}</tr></thead>
                    <tbody>
                      {pageRows.map((r, i) => (
                        <tr key={i} className="border-b border-line last:border-0">
                          {cols.map((c, j) => {
                            const v = r[c]
                            return <td key={c} className={cn('whitespace-nowrap px-3 py-2 first:pl-5 last:pr-5', typeof v === 'number' ? 'num text-right text-fg' : j === 0 ? 'max-w-[280px] truncate font-medium text-fg' : 'text-muted')}>{typeof v === 'number' && !c.includes('%') && !c.includes('Rating') ? formatNumber(v) : String(v)}</td>
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > PAGE && <div className="no-print border-t border-line px-5 py-3"><Pagination page={page} pageCount={Math.ceil(rows.length / PAGE)} onChange={setPage} total={rows.length} pageSize={PAGE} /></div>}
              </>
            )}
          </Card>

          <Card className="no-print">
            <CardHeader title="Recent & scheduled reports" />
            <CardBody className="px-0 pb-2 sm:px-0">
              {!saved.data ? <div className="px-6"><Skeleton className="h-32" /></div> : (
                <ul className="divide-y divide-line">
                  {saved.data.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                      <span className="grid size-9 place-items-center rounded-lg bg-surface-2 text-subtle">{r.format === 'CSV' ? <FileSpreadsheet className="size-4" /> : <FileText className="size-4" />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-fg">{r.name}</span>
                        <span className="block text-xs text-subtle">{r.createdBy} · {formatRelative(r.createdAt)} · {r.range}</span>
                      </span>
                      {r.schedule && <Badge tone="iris" icon={<CalendarClock className="size-3" />}>{r.schedule}</Badge>}
                      <Badge tone="neutral">{r.format}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}
