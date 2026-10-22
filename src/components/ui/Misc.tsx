import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Minus } from 'lucide-react'
import { memo, useId } from 'react'
import { cn } from '@/utils/cn'
import { formatChange, initials } from '@/utils/format'

export function Avatar({ name, color, size = 'md', className }: { name: string; color?: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const s = { sm: 'size-7 text-[11px]', md: 'size-9 text-xs', lg: 'size-12 text-sm' }[size]
  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-full font-semibold text-white', s, className)}
      style={{ background: color ? `linear-gradient(140deg, ${color}, color-mix(in srgb, ${color} 70%, #000))` : 'var(--subtle)' }}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

export function Delta({ value, className, inverse, suffix = '' }: { value: number; className?: string; inverse?: boolean; suffix?: string }) {
  const good = inverse ? value < 0 : value > 0
  const flat = Math.abs(value) < 0.05
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        'num inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-semibold',
        flat ? 'bg-surface-2 text-subtle' : good ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
        className,
      )}
    >
      <Icon className="size-3" strokeWidth={2.5} aria-hidden />
      {formatChange(value)}
      {suffix}
    </span>
  )
}

export function ProgressBar({
  value,
  max = 100,
  tone = 'accent',
  className,
  label,
}: {
  value: number
  max?: number
  tone?: 'accent' | 'success' | 'warning' | 'danger' | 'iris'
  className?: string
  label?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const color = { accent: 'bg-accent', success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger', iris: 'bg-iris-500' }[tone]
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-3', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out-expo)]', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Lightweight SVG sparkline — avoids pulling a chart library into KPI cards. */
export const Sparkline = memo(function Sparkline({
  data,
  color = 'var(--chart-1)',
  className,
  height = 36,
}: {
  data: number[]
  color?: string
  className?: string
  height?: number
}) {
  const id = useId()
  if (data.length < 2) return null
  const w = 120
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, height - 3 - ((v - min) / span) * (height - 6)])
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={cn('h-9 w-full overflow-visible', className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${height} L0,${height} Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color} />
    </svg>
  )
})

export function Pagination({
  page,
  pageCount,
  onChange,
  total,
  pageSize,
}: {
  page: number
  pageCount: number
  onChange: (p: number) => void
  total: number
  pageSize: number
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  )
  return (
    <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Pagination">
      <p className="num text-subtle">
        <span className="font-medium text-fg">{from}–{to}</span> of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg disabled:opacity-30"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        {pages.map((p, i) => (
          <span key={p} className="flex items-center">
            {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-subtle">…</span>}
            <button
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'num grid size-8 place-items-center rounded-lg text-[13px] font-medium transition',
                p === page ? 'bg-fg text-bg' : 'text-muted hover:bg-surface-2 hover:text-fg',
              )}
            >
              {p}
            </button>
          </span>
        ))}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount}
          className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg disabled:opacity-30"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </nav>
  )
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-surface-2 px-1 font-mono text-[10px] font-medium text-subtle">
      {children}
    </kbd>
  )
}
