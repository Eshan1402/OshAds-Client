import { BellOff, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { NotificationKind } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Tabs } from '@/components/ui/SegmentedControl'
import { NotificationItem, useNotifications } from '@/components/notifications/NotificationCenter'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { PageTransition } from '@/components/layout/PageTransition'

type Filter = 'all' | 'unread' | 'alerts' | NotificationKind

export default function NotificationsPage() {
  useDocumentTitle('Notifications')
  const { data, error, refetch, unread, markRead, markAll } = useNotifications()
  const [filter, setFilter] = useState<Filter>('all')
  const list = data?.filter((n) =>
    filter === 'all' ? true : filter === 'unread' ? !n.read : filter === 'alerts' ? n.severity === 'warning' || n.severity === 'critical' : n.kind === filter,
  )
  return (
    <PageTransition>
      <PageHeader title="Notifications" description="Milestones, budget alerts and performance changes across your campaigns." actions={<Button variant="outline" size="sm" leftIcon={<CheckCheck className="size-4" />} onClick={markAll} disabled={!unread}>Mark all read</Button>} />
      <Card className="overflow-hidden">
        <Tabs
          className="px-3"
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: 'all', label: 'All', count: data?.length },
            { value: 'unread', label: 'Unread', count: unread },
            { value: 'alerts', label: 'Alerts' },
            { value: 'milestone', label: 'Milestones' },
            { value: 'budget', label: 'Budget' },
            { value: 'system', label: 'System' },
          ]}
        />
        <div className="p-2">
          {error ? <ErrorState error={error} onRetry={refetch} /> : !list ? (
            <div className="space-y-2 p-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : list.length === 0 ? (
            <EmptyState icon={<BellOff />} title={filter === 'unread' ? 'You’re all caught up' : 'No notifications'} description="New milestones and alerts will appear here in real time." />
          ) : (
            list.map((n) => <NotificationItem key={n.id} n={n} onRead={markRead} />)
          )}
        </div>
      </Card>
    </PageTransition>
  )
}
