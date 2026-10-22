import { Gift } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { appsService } from '@/services/appsService'
import { queryClient } from '@/services/queryClient'
import { rewardsService } from '@/services/rewardsService'
import { countryName } from '@/data/geo'
import { formatDate } from '@/utils/format'
import { AppIcon } from '@/components/ui/AppIcon'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Tabs } from '@/components/ui/SegmentedControl'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { PageTransition } from '@/components/layout/PageTransition'

type Status = 'pending' | 'confirmed' | 'rejected'

/** Staff confirm installs here when an advertiser reports them outside a postback. Confirming also counts a download. */
export default function RewardsReviewPage() {
  useDocumentTitle('Rewards')
  const { can } = useAuth()
  const toast = useToast()
  const [status, setStatus] = useState<Status>('pending')
  const [busy, setBusy] = useState<number | null>(null)
  const list = useQuery(`rewards:review:${status}`, () => rewardsService.forReview(status), { keepPrevious: true })
  const apps = useQuery('apps:all', () => appsService.list({ includeHidden: true }))
  const byId = new Map(apps.data?.map((a) => [a.id, a]))

  const decide = async (id: number, action: 'confirm' | 'reject') => {
    setBusy(id)
    try {
      await rewardsService[action](id)
      toast({ tone: 'success', title: action === 'confirm' ? 'Install confirmed' : 'Reward rejected', description: action === 'confirm' ? '20 coins added to the visitor’s wallet and the download counted.' : 'No coins were added.' })
      queryClient.invalidate('rewards:review')
      queryClient.invalidate('analytics')
    } catch (e) {
      toast({ tone: 'error', title: 'Couldn’t update the reward', description: (e as Error).message })
    } finally {
      setBusy(null)
    }
  }

  return (
    <PageTransition>
      <PageHeader title="Rewards" description="Osh coin claims from Download clicks. Coins are paid once an install is confirmed." />
      <Tabs className="mb-6" value={status} onChange={setStatus} tabs={[{ value: 'pending', label: 'Pending' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'rejected', label: 'Rejected' }]} />
      <Card className="overflow-hidden">
        {list.error ? (
          <ErrorState error={list.error} onRetry={list.refetch} />
        ) : !list.data ? (
          <div className="p-6"><Skeleton className="h-40" /></div>
        ) : list.data.length === 0 ? (
          <EmptyState icon={<Gift />} title={`No ${status} rewards`} description="Claims appear here when visitors tap Download on an app." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-xs text-subtle">
                  <th className="px-5 py-2.5 font-medium">App</th>
                  <th className="px-3 py-2.5 font-medium">Clicked</th>
                  <th className="px-3 py-2.5 font-medium">Country · device</th>
                  <th className="px-3 py-2.5 font-medium">Click ID</th>
                  <th className="px-3 py-2.5 text-right font-medium">Coins</th>
                  {status === 'pending' && can('campaigns:write') && <th className="px-5 py-2.5 text-right font-medium">Decision</th>}
                </tr>
              </thead>
              <tbody>
                {list.data.map((r) => {
                  const app = byId.get(r.appId)
                  return (
                    <tr key={r.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-2.5">
                        <span className="flex items-center gap-2 font-medium text-fg">{app && <AppIcon app={app} size="xs" />}{app?.name ?? r.appId}</span>
                      </td>
                      <td className="num px-3 py-2.5 text-muted">{formatDate(new Date(r.createdAt).toISOString())}</td>
                      <td className="px-3 py-2.5 text-muted">{[r.country ? countryName(r.country) : 'Unknown', r.device].filter(Boolean).join(' · ')}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-subtle">{r.clickId}</td>
                      <td className="num px-3 py-2.5 text-right font-semibold text-fg">{r.coins}</td>
                      {status === 'pending' && can('campaigns:write') && (
                        <td className="px-5 py-2.5 text-right">
                          <span className="inline-flex gap-2">
                            <Button size="sm" variant="outline" loading={busy === r.id} onClick={() => decide(r.id, 'reject')}>Reject</Button>
                            <Button size="sm" loading={busy === r.id} onClick={() => decide(r.id, 'confirm')}>Confirm install</Button>
                          </span>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader title="Automatic confirmation" description="Let each advertiser’s tracker confirm installs, so nobody has to click Confirm." />
        <CardBody className="space-y-3 text-[13px] text-muted">
          <p>1. In the app’s settings, set the tracking URL to the advertiser’s tracking link and put <code className="rounded bg-surface-2 px-1 font-mono text-fg">{'{click_id}'}</code> where their link expects your click ID.</p>
          <p>2. Give the advertiser this postback URL (replace the key with the <code className="rounded bg-surface-2 px-1 font-mono text-fg">POSTBACK_KEY</code> from the server settings):</p>
          <pre className="overflow-x-auto rounded-xl bg-surface-2 p-3 font-mono text-xs text-fg">{`${location.origin}/api/postback?click_id={click_id}&event=install&payout={payout}&key=YOUR_POSTBACK_KEY`}</pre>
          <p>Each confirmed install counts as a download on the dashboard and adds 20 coins to that visitor’s wallet.</p>
        </CardBody>
      </Card>
    </PageTransition>
  )
}
