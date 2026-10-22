import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { formatCompact, formatNumber, formatPercent } from '@/utils/format'
import { Skeleton } from '@/components/ui/Feedback'

/** Horizontal conversion funnel — each stage is a bar sized to its share of the first stage. */
export function FunnelChart({ stages }: { stages?: Array<{ stage: string; value: number }> }) {
  if (!stages) return <Skeleton className="h-64 w-full rounded-xl" />
  const top = stages[0]?.value || 1
  const overall = stages.length > 1 ? (stages[stages.length - 1].value / top) * 100 : 0
  const opacities = [1, 0.75, 0.55]
  return (
    <div>
      <ol className="space-y-1">
        {stages.map((s, i) => {
          const pct = (s.value / top) * 100
          const step = i > 0 ? (s.value / stages[i - 1].value) * 100 : null
          return (
            <li key={s.stage}>
              {step !== null && (
                <div className="flex items-center gap-2 py-1.5 pl-3 text-xs text-subtle">
                  <ArrowDown className="size-3.5" aria-hidden />
                  <span className="num font-semibold text-fg">{formatPercent(step)}</span> {i === 1 ? 'click-through' : 'install rate'}
                </div>
              )}
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-medium text-muted">{s.stage}</span>
                <span className="num font-display text-lg font-bold text-fg" title={formatNumber(s.value)}>{formatCompact(s.value)}</span>
              </div>
              <div className="mt-1.5 h-9 overflow-hidden rounded-lg bg-surface-2">
                <motion.div
                  className="h-full rounded-lg"
                  style={{ background: 'var(--chart-1)', opacity: opacities[i] ?? 0.45 }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.max(pct, 1.5)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </li>
          )
        })}
      </ol>
      <div className="mt-5 flex items-center justify-between rounded-xl bg-accent-soft px-4 py-3">
        <span className="text-sm font-medium text-accent-text">Impression → download conversion</span>
        <span className="num font-display text-xl font-bold text-accent-text">{formatPercent(overall, 2)}</span>
      </div>
    </div>
  )
}
