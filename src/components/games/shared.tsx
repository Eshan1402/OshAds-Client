import { RotateCcw } from 'lucide-react'
import { useCallback, useRef, type PointerEvent, type ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { Dir } from '@/lib/games'
import { cn } from '@/utils/cn'

/**
 * The visitor's best result for a game, kept in this browser (no login, like the coin wallet).
 * `lower` is for times and move counts, where smaller is better.
 */
export function useBest(game: string, better: 'higher' | 'lower' = 'higher') {
  const [best, setBest] = useLocalStorage<number | null>(`osh:games:${game}:best`, null)
  const record = useCallback(
    (value: number) => setBest((prev) => (prev === null || (better === 'higher' ? value > prev : value < prev) ? value : prev)),
    [setBest, better],
  )
  return [best, record] as const
}

export function ScoreBar({ items, onNew, status }: { items: Array<{ label: string; value: ReactNode }>; onNew: () => void; status?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
      {items.map((it) => (
        <div key={it.label} className="min-w-14">
          <p className="text-[11px] uppercase tracking-[0.12em] text-subtle">{it.label}</p>
          {/* Counts pop when they change; running clocks don't, or they'd pulse every second. */}
          <p key={it.label === 'Time' ? undefined : String(it.value)} className={cn('num origin-left font-display text-xl font-semibold text-fg', it.label !== 'Time' && 'animate-tick')} aria-live="polite">
            {it.value}
          </p>
        </div>
      ))}
      <div className="ml-auto flex items-center gap-3">
        {status && <p className="text-sm font-medium text-fg" role="status">{status}</p>}
        <button type="button" onClick={onNew} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-sm font-medium text-fg transition hover:bg-surface-2 active:scale-[0.97]">
          <RotateCcw className="size-3.5" aria-hidden /> New game
        </button>
      </div>
    </div>
  )
}

export const ARROWS: Record<string, Dir> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' }

/** Swipe on touch screens: calls back with the direction of a short drag. */
export function useSwipe(onDir: (d: Dir) => void) {
  const start = useRef<{ x: number; y: number } | null>(null)
  return {
    onPointerDown: (e: PointerEvent) => (start.current = { x: e.clientX, y: e.clientY }),
    onPointerUp: (e: PointerEvent) => {
      const s = start.current
      start.current = null
      if (!s) return
      const dx = e.clientX - s.x
      const dy = e.clientY - s.y
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
      onDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
    },
  }
}

/** Colours for game pieces, picked to stay distinct for most colour-blind visitors too. */
export const PIECE_COLORS = ['#2F5BFF', '#F59E0B', '#16A34A', '#DC2626', '#7C3AED', '#0891B2', '#DB2777']

/** A short vibration on phones that support it (Android); silently does nothing elsewhere. */
export const buzz = (ms = 12) => navigator.vibrate?.(ms)
