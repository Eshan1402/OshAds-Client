import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { greeting } from '@/utils/format'
import { Card, CardHeader } from '@/components/ui/Card'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { KpiGrid } from '@/components/analytics/MetricCard'
import { DeviceBreakdown, GeoBreakdown, TrafficSources } from '@/components/analytics/Breakdowns'
import { ActivityFeed, AlertsPanel, FunnelCard, SystemHealth, TopApps } from '@/components/analytics/Panels'
import { CampaignTable } from '@/components/campaigns/CampaignTable'
import { TrafficChart } from '@/components/charts/TrafficChart'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { PageTransition } from '@/components/layout/PageTransition'

export default function OverviewPage() {
  useDocumentTitle('Overview')
  const { session } = useAuth()
  const first = session!.user.name.split(' ')[0]
  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${first}`}
        description="Here’s what’s happening across your campaigns."
        actions={<DateRangePicker />}
      />
      <KpiGrid />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <TrafficChart />
        <FunnelCard />
      </div>
      <Card>
        <CardHeader
          title="Campaign performance"
          description="Top campaigns by downloads"
          action={<Link to="/dashboard/campaigns" className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent-text hover:underline">All campaigns <ArrowRight className="size-3.5" /></Link>}
          className="pb-4"
        />
        <div className="border-t border-line">
          <CampaignTable compact pageSize={6} />
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <TopApps />
        <TrafficSources />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <GeoBreakdown />
        <DeviceBreakdown />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <AlertsPanel />
        <ActivityFeed />
        <SystemHealth />
      </div>
    </PageTransition>
  )
}
