import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import type { CampaignStatus } from '@/types'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'iris'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-muted ring-line',
  accent: 'bg-accent-soft text-accent-text ring-accent/20',
  success: 'bg-success-soft text-success ring-success/20',
  warning: 'bg-warning-soft text-warning ring-warning/20',
  danger: 'bg-danger-soft text-danger ring-danger/20',
  info: 'bg-info-soft text-info ring-info/20',
  iris: 'bg-iris-500/10 text-iris-600 ring-iris-500/20 dark:text-iris-400',
}

export function Badge({
  tone = 'neutral',
  dot,
  pulse,
  icon,
  className,
  children,
}: {
  tone?: BadgeTone
  dot?: boolean
  pulse?: boolean
  icon?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full bg-current', pulse && 'animate-pulse-dot')} aria-hidden />}
      {icon}
      {children}
    </span>
  )
}

const statusMap: Record<CampaignStatus, { tone: BadgeTone; label: string }> = {
  active: { tone: 'success', label: 'Active' },
  paused: { tone: 'warning', label: 'Paused' },
  scheduled: { tone: 'info', label: 'Scheduled' },
  completed: { tone: 'neutral', label: 'Completed' },
  archived: { tone: 'neutral', label: 'Archived' },
  draft: { tone: 'iris', label: 'Draft' },
}

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const s = statusMap[status]
  return (
    <Badge tone={s.tone} dot pulse={status === 'active'}>
      {s.label}
    </Badge>
  )
}

export const statusLabel = (s: CampaignStatus) => statusMap[s].label
