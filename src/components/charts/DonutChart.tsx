import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatNumber, formatPercent } from '@/utils/format'
import { TooltipCard } from './ChartTooltip'

export interface DonutDatum {
  name: string
  value: number
  color: string
}

export function DonutChart({ data, centerLabel, centerValue, size = 200 }: { data: DonutDatum[]; centerLabel: string; centerValue: string; size?: number }) {
  const [active, setActive] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="70%"
            outerRadius="100%"
            paddingAngle={1.5}
            stroke="var(--surface)"
            strokeWidth={2}
            startAngle={90}
            endAngle={-270}
            onMouseEnter={(_, i) => setActive(i)}
            onMouseLeave={() => setActive(null)}
            animationDuration={800}
          >
            {data.map((d, i) => (
              <Cell key={d.name} fill={d.color} opacity={active === null || active === i ? 1 : 0.35} style={{ transition: 'opacity 150ms' }} />
            ))}
          </Pie>
          <Tooltip
            content={({ active: a, payload }) =>
              a && payload?.length ? (
                <TooltipCard
                  title={payload[0].name}
                  rows={[
                    { label: 'Value', value: formatNumber(payload[0].value as number), color: (payload[0].payload as DonutDatum).color },
                    { label: 'Share', value: formatPercent(((payload[0].value as number) / total) * 100) },
                  ]}
                />
              ) : null
            }
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="num font-display text-2xl font-bold text-fg">{active !== null ? formatPercent((data[active].value / total) * 100) : centerValue}</p>
          <p className="text-xs text-subtle">{active !== null ? data[active].name : centerLabel}</p>
        </div>
      </div>
    </div>
  )
}

export function Legend({ items }: { items: Array<{ name: string; color: string; value?: string }> }) {
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.name} className="flex items-center justify-between gap-3 text-[13px]">
          <span className="flex items-center gap-2 text-muted">
            <span className="size-2.5 rounded-[3px]" style={{ background: i.color }} aria-hidden />
            {i.name}
          </span>
          {i.value && <span className="num font-semibold text-fg">{i.value}</span>}
        </li>
      ))}
    </ul>
  )
}
