import { AnimatePresence, motion } from 'framer-motion'
import { Activity, AlertTriangle, Bell, BellOff, CheckCheck, CheckCircle2, CircleAlert } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '@/context/ToastContext'
import { useQuery } from '@/hooks/useQuery'
import { notificationsService } from '@/services/notificationsService'
import { queryClient } from '@/services/queryClient'
import { subscribe } from '@/services/realtime'
import type { AppNotification } from '@/types'
import { cn } from '@/utils/cn'
import { formatRelative } from '@/utils/format'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { Popover } from '@/components/ui/Popover'

export const severityIcon: Record<AppNotification['severity'], React.ReactNode> = {
  critical: <CircleAlert className="size-4 text-danger" />,
  warning: <AlertTriangle className="size-4 text-warning" />,
  success: <CheckCircle2 className="size-4 text-success" />,
  info: <Activity className="size-4 text-info" />,
}

export function useNotifications() {
  const toast = useToast()
  const q = useQuery('notifications:list', () => notificationsService.list())
  useEffect(() => {
    notificationsService.startStream()
    return subscribe('notification:new', (n) => {
      queryClient.invalidate('notifications')
      toast({ tone: n.severity === 'critical' ? 'error' : n.severity === 'warning' ? 'warning' : 'info', title: n.title, description: n.body })
    })
  }, [toast])
  const markRead = async (id: string) => {
    queryClient.setData<AppNotification[]>('notifications:list', (prev) => prev?.map((n) => (n.id === id ? { ...n, read: true } : n)) ?? [])
    await notificationsService.markRead(id)
  }
  const markAll = async () => {
    queryClient.setData<AppNotification[]>('notifications:list', (prev) => prev?.map((n) => ({ ...n, read: true })) ?? [])
    await notificationsService.markAllRead()
  }
  return { ...q, unread: q.data?.filter((n) => !n.read).length ?? 0, markRead, markAll }
}

export function NotificationItem({ n, onRead, onNavigate }: { n: AppNotification; onRead: (id: string) => void; onNavigate?: () => void }) {
  const body = (
    <>
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2">{severityIcon[n.severity]}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className={cn('text-[13px] text-fg', !n.read && 'font-semibold')}>{n.title}</span>
          <span className="shrink-0 text-[11px] text-subtle">{formatRelative(n.createdAt)}</span>
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted">{n.body}</span>
      </span>
      {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
    </>
  )
  const cls = 'flex w-full gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-surface-2'
  return n.href ? (
    <Link to={n.href} className={cls} onClick={() => { onRead(n.id); onNavigate?.() }}>{body}</Link>
  ) : (
    <button className={cls} onClick={() => onRead(n.id)}>{body}</button>
  )
}

export function NotificationCenter() {
  const { data, unread, markRead, markAll } = useNotifications()
  return (
    <Popover
      trigger={({ toggle, open, id }) => (
        <button
          onClick={toggle}
          aria-expanded={open}
          aria-controls={id}
          aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
          className="relative grid size-11 place-items-center rounded-full text-muted sm:size-9 transition hover:bg-surface-2 hover:text-fg"
        >
          <Bell className="size-[18px]" />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="num absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white ring-2 ring-surface"
              >
                {unread}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      )}
      panelClassName="w-[min(380px,calc(100vw-24px))] p-0 -right-12 sm:right-0"
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-display text-sm font-semibold text-fg">Notifications</h2>
            <button onClick={markAll} disabled={!unread} className="inline-flex items-center gap-1 text-xs font-semibold text-accent-text disabled:opacity-40">
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-1.5">
            {!data ? (
              <div className="space-y-2 p-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : data.length === 0 ? (
              <EmptyState compact icon={<BellOff />} title="No notifications" description="We’ll let you know when campaigns hit milestones or need attention." />
            ) : (
              data.slice(0, 8).map((n) => <NotificationItem key={n.id} n={n} onRead={markRead} onNavigate={close} />)
            )}
          </div>
          <Link to="/dashboard/notifications" onClick={close} className="block border-t border-line px-4 py-2.5 text-center text-[13px] font-semibold text-accent-text hover:bg-surface-2">
            View all notifications
          </Link>
        </div>
      )}
    </Popover>
  )
}
