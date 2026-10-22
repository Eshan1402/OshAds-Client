import type { ReactNode } from 'react'

export const chartColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)']
export const otherColor = 'var(--chart-other)'

export const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fill: 'var(--subtle)', fontSize: 11 },
} as const

export function TooltipCard({ title, rows }: { title: ReactNode; rows: Array<{ label: string; value: string; color?: string; dashed?: boolean }> }) {
  return (
    <div className="min-w-44 rounded-xl glass-strong px-3 py-2.5 shadow-lg">
      <p className="mb-1.5 text-xs font-medium text-subtle">{title}</p>
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 text-[13px]">
            <span className="flex items-center gap-2 text-muted">
              {r.color && (
                <span
                  className="h-0.5 w-3 rounded-full"
                  style={r.dashed ? { backgroundImage: `linear-gradient(90deg, ${r.color} 50%, transparent 50%)`, backgroundSize: '4px 2px' } : { background: r.color }}
                />
              )}
              {r.label}
            </span>
            <span className="num font-semibold text-fg">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
