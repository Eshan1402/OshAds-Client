import { CalendarRange } from 'lucide-react'
import { useState } from 'react'
import { useDashboard } from '@/context/DashboardContext'
import type { RangeKey } from '@/types'
import { formatShortDate, toISODate, addDays } from '@/utils/format'
import { Button } from './Button'
import { Field, Input } from './Form'
import { Popover } from './Popover'
import { SegmentedControl } from './SegmentedControl'

const presets: Array<{ value: RangeKey; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
]

export function DateRangePicker() {
  const { range, setRangeKey, setCustomRange } = useDashboard()
  const today = toISODate(new Date())
  const [from, setFrom] = useState(range.from)
  const [to, setTo] = useState(range.to)
  const invalid = from > to ? 'Start date must be before end date.' : undefined
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedControl
        label="Date range"
        value={range.key === 'custom' ? ('custom' as RangeKey) : range.key}
        onChange={setRangeKey}
        options={presets}
      />
      <Popover
        trigger={({ toggle, open, id }) => (
          <Button variant={range.key === 'custom' ? 'secondary' : 'outline'} size="sm" onClick={toggle} aria-expanded={open} aria-controls={id} leftIcon={<CalendarRange className="size-3.5" />}>
            {range.key === 'custom' ? `${formatShortDate(range.from)} – ${formatShortDate(range.to)}` : 'Custom'}
          </Button>
        )}
        panelClassName="w-72 p-4"
      >
        {(close) => (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (invalid) return
              setCustomRange(from, to)
              close()
            }}
            className="space-y-3"
          >
            <p className="text-sm font-semibold text-fg">Custom range</p>
            <Field label="From">{({ id }) => <Input id={id} type="date" inputSize="sm" value={from} min={toISODate(addDays(new Date(), -720))} max={today} onChange={(e) => setFrom(e.target.value)} />}</Field>
            <Field label="To" error={invalid}>{({ id, invalid: inv, describedBy }) => <Input id={id} type="date" inputSize="sm" value={to} max={today} invalid={inv} aria-describedby={describedBy} onChange={(e) => setTo(e.target.value)} />}</Field>
            <Button type="submit" size="sm" className="w-full" disabled={!!invalid}>Apply range</Button>
          </form>
        )}
      </Popover>
    </div>
  )
}
