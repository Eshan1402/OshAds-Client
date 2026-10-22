import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card min-w-0', className)} {...rest} />
}

export function CardHeader({
  title,
  description,
  action,
  className,
  id,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
  id?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6', className)}>
      <div className="min-w-0">
        <h3 id={id} className="font-display text-[15px] font-semibold tracking-tight text-fg">
          {title}
        </h3>
        {description && <p className="mt-0.5 text-[13px] text-subtle">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-5 pt-4 sm:px-6', className)} {...rest} />
}
