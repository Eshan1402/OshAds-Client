import { Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { campaignsService } from '@/services/campaignsService'
import type { CampaignStatus } from '@/types'
import { formatCompact, formatCurrency } from '@/utils/format'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/SegmentedControl'
import { CampaignTable } from '@/components/campaigns/CampaignTable'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { PageTransition } from '@/components/layout/PageTransition'

const tabs: Array<{ value: CampaignStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'draft', label: 'Drafts' },
  { value: 'archived', label: 'Archived' },
]

export default function CampaignsPage() {
  useDocumentTitle('Campaigns')
  const { can } = useAuth()
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') as CampaignStatus | null) ?? 'all'
  const { data } = useQuery('campaigns:list:summary', () => campaignsService.list({ includeArchived: true }))
  const count = (s: CampaignStatus | 'all') => data?.filter((c) => (s === 'all' ? c.status !== 'archived' : c.status === s)).length
  const live = data?.filter((c) => c.status === 'active') ?? []
  const budget = live.reduce((s, c) => s + c.budget, 0)
  const spent = live.reduce((s, c) => s + c.spent, 0)

  return (
    <PageTransition>
      <PageHeader
        title="Campaigns"
        description="Plan, launch and optimise install campaigns across your owned traffic."
        actions={can('campaigns:write') && <ButtonLink to="/dashboard/campaigns/new" leftIcon={<Plus className="size-4" />}>Create campaign</ButtonLink>}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Active campaigns', data ? String(live.length) : '—'],
          ['Live budget', data ? formatCurrency(budget) : '—'],
          ['Spent to date', data ? formatCurrency(spent) : '—'],
          ['Downloads (active)', data ? formatCompact(live.reduce((s, c) => s + c.downloads, 0)) : '—'],
        ].map(([k, v]) => (
          <div key={k} className="card px-4 py-3.5">
            <p className="text-xs text-subtle">{k}</p>
            <p className="num mt-1 font-display text-xl font-bold text-fg">{v}</p>
          </div>
        ))}
      </div>
      <Card className="overflow-hidden">
        <Tabs
          className="px-3"
          tabs={tabs.map((t) => ({ ...t, count: count(t.value) }))}
          value={status}
          onChange={(v) => setParams(v === 'all' ? {} : { status: v })}
        />
        <CampaignTable key={`${status}:${params.get('q') ?? ''}`} status={status} showStatusFilter={false} initialQuery={params.get('q') ?? undefined} />
      </Card>
    </PageTransition>
  )
}
