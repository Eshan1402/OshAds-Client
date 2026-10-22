import { Star } from 'lucide-react'
import { cn } from '@/utils/cn'

// A 0 rating means "no ratings yet": render nothing rather than five empty stars.
export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  if (!(value > 0)) return null
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i))
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-line-strong" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="text-gold-500" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        )
      })}
    </span>
  )
}

export function RatingPill({ value, className }: { value: number; className?: string }) {
  if (!(value > 0)) return null
  return (
    <span className={cn('inline-flex items-center gap-1 text-[13px] font-semibold text-fg num', className)}>
      <Star className="size-3.5 text-gold-500" fill="currentColor" strokeWidth={0} aria-hidden />
      {value.toFixed(1)}
      <span className="sr-only">out of 5 stars</span>
    </span>
  )
}
