import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { resolveRange } from '@/services/analyticsService'
import type { DateRange, RangeKey } from '@/types'

interface DashboardCtx {
  range: DateRange
  setRangeKey: (k: RangeKey) => void
  setCustomRange: (from: string, to: string) => void
}

const Ctx = createContext<DashboardCtx | null>(null)

/** Global dashboard date range shared by every analytics widget. */
export function DashboardProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState<RangeKey>('30d')
  const [custom, setCustom] = useState<{ from: string; to: string }>()
  const value = useMemo<DashboardCtx>(
    () => ({
      range: resolveRange(key, custom),
      setRangeKey: (k) => setKey(k),
      setCustomRange: (from, to) => {
        setCustom({ from, to })
        setKey('custom')
      },
    }),
    [key, custom],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useDashboard() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider')
  return ctx
}

export const rangeKeyOf = (r: DateRange) => `${r.key}:${r.from}:${r.to}`
