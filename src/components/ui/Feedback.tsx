import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon: ReactNode
  title: string
  description: ReactNode
  action?: ReactNode
  className?: string
  compact?: boolean
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'px-4 py-8' : 'px-6 py-14', className)}>
      <div className="relative mb-4">
        <div className="absolute inset-0 -m-3 rounded-full bg-accent-soft blur-xl" aria-hidden />
        <div className="relative grid size-12 place-items-center rounded-2xl glass text-accent-text shadow-sm [&>svg]:size-5">
          {icon}
        </div>
      </div>
      <h3 className="font-display text-base font-semibold text-fg">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  error,
  onRetry,
  className,
  compact,
}: {
  title?: string
  error?: Error
  onRetry?: () => void
  className?: string
  compact?: boolean
}) {
  const offline = error?.message?.toLowerCase().includes('offline')
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center text-center', compact ? 'px-4 py-8' : 'px-6 py-14', className)}>
      <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-danger-soft text-danger">
        {offline ? <WifiOff className="size-5" /> : <AlertTriangle className="size-5" />}
      </div>
      <h3 className="font-display text-base font-semibold text-fg">{offline ? 'You’re offline' : title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">
        {error?.message && !offline ? error.message : offline ? error?.message : 'We couldn’t load this right now. Please try again.'}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry} leftIcon={<RefreshCw className="size-3.5" />}>
          Try again
        </Button>
      )}
    </div>
  )
}
