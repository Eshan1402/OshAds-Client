import { motion } from 'framer-motion'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { BLOCK, fit, fitsAnywhere, placeBlock, SHAPES } from '@/lib/games'
import { cn } from '@/utils/cn'
import { buzz, PIECE_COLORS, ScoreBar, useBest } from './shared'

type Piece = { shape: Array<[number, number]>; color: number } | null
const deal = (): Piece[] =>
  Array.from({ length: 3 }, () => ({ shape: SHAPES[Math.floor(Math.random() * SHAPES.length)], color: 1 + Math.floor(Math.random() * PIECE_COLORS.length) }))
const fresh = () => ({ board: Array<number>(BLOCK * BLOCK).fill(0), tray: deal(), score: 0 })
const GAP = 4 // px between board cells, matches gap-1
// On touch the piece floats above the finger so the finger doesn't hide where it will land.
const LIFT: Record<string, number> = { touch: 70, pen: 40, mouse: 0 }

function Shape({ shape, color, cell, gap = 2 }: { shape: Array<[number, number]>; color: number; cell: number; gap?: number }) {
  const rows = Math.max(...shape.map(([r]) => r)) + 1
  const cols = Math.max(...shape.map(([, c]) => c)) + 1
  return (
    <span className="grid" style={{ gap, gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gridTemplateRows: `repeat(${rows}, ${cell}px)` }}>
      {shape.map(([r, c]) => (
        <span key={`${r}${c}`} className="rounded-[4px]" style={{ gridRow: r + 1, gridColumn: c + 1, background: PIECE_COLORS[color - 1] }} />
      ))}
    </span>
  )
}

export default function BlockPuzzle() {
  const [g, setG] = useState(fresh)
  const [picked, setPicked] = useState<number | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [drag, setDrag] = useState<{ x: number; y: number; lift: number; moved: boolean } | null>(null)
  const [burst, setBurst] = useState<{ cells: Array<[number, number]>; n: number }>({ cells: [], n: 0 })
  const [gain, setGain] = useState<{ n: number; lines: number; x: number; y: number; key: number } | null>(null) // floating "+N"
  const [back, setBack] = useState<{ i: number; x: number; y: number; tx: number; ty: number } | null>(null) // piece sliding back to the tray
  const [best, record] = useBest('blockpuzzle')
  const grid = useRef<HTMLDivElement>(null)
  const over = g.tray.every((p) => !p || !fitsAnywhere(g.board, p.shape))
  useEffect(() => record(g.score), [g.score, record])

  const piece = picked === null ? null : g.tray[picked]
  const preview = piece && hover !== null ? fit(g.board, piece.shape, hover) : null
  const cellPx = grid.current ? (grid.current.clientWidth - 12 - GAP * (BLOCK - 1)) / BLOCK : 36

  const drop = (at: number) => {
    const cells = piece && fit(g.board, piece.shape, at)
    if (!piece || !cells) return false
    const { board, lines } = placeBlock(g.board, cells, piece.color)
    const placed = g.board.map((v, i) => (cells.includes(i) ? piece.color : v))
    const cleared = placed.flatMap((v, i): Array<[number, number]> => (v && !board[i] ? [[i, v]] : []))
    const tray = g.tray.map((p, i) => (i === picked ? null : p))
    setG({ board, tray: tray.every((p) => !p) ? deal() : tray, score: g.score + cells.length + 10 * lines * lines })
    if (lines) setBurst((b) => ({ cells: cleared, n: b.n + 1 }))
    const spots = cells.map((c) => grid.current!.children[c] as HTMLElement)
    setGain({
      n: cells.length + 10 * lines * lines,
      lines,
      x: spots.reduce((s, el) => s + el.offsetLeft + el.offsetWidth / 2, 0) / spots.length,
      y: Math.min(...spots.map((el) => el.offsetTop)),
      key: Date.now(),
    })
    setPicked(null)
    setHover(null)
    buzz(lines ? 35 : 10)
    return true
  }

  /** Board cell under the floating piece's top-left block. */
  const cellUnder = (x: number, y: number, lift: number) => {
    if (!piece) return null
    const cols = Math.max(...piece.shape.map(([, c]) => c)) + 1
    const rows = Math.max(...piece.shape.map(([r]) => r)) + 1
    const left = x - (cols * cellPx + (cols - 1) * GAP) / 2
    const top = y - lift - (rows * cellPx + (rows - 1) * GAP)
    const el = document.elementFromPoint(left + cellPx / 2, top + cellPx / 2) as HTMLElement | null
    return el?.dataset.cell === undefined ? null : Number(el.dataset.cell)
  }

  const onDown = (i: number) => (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setPicked(i)
    setDrag({ x: e.clientX, y: e.clientY, lift: LIFT[e.pointerType] ?? 0, moved: false })
  }
  const onMove = (e: PointerEvent) => {
    if (!drag) return
    const moved = drag.moved || Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6
    setDrag({ ...drag, x: e.clientX, y: e.clientY, moved })
    if (moved) setHover(cellUnder(e.clientX, e.clientY, drag.lift))
  }
  // A drag drops where it's released; a tap only selects, and the next tap on the board places it.
  const onUp = () => {
    if (!drag) return
    if (drag.moved) {
      if ((hover === null || !drop(hover)) && picked !== null) {
        const home = document.querySelector(`[data-piece="${picked}"]`)?.getBoundingClientRect()
        if (home) setBack({ i: picked, x: drag.x, y: drag.y - drag.lift, tx: home.left + home.width / 2, ty: home.top + home.height * 0.8 })
        setPicked(null)
      }
      setHover(null)
    }
    setDrag(null)
  }

  return (
    <div>
      <ScoreBar
        items={[{ label: 'Score', value: g.score }, { label: 'Best', value: best ?? '—' }]}
        status={over ? 'No room left' : undefined}
        onNew={() => {
          setG(fresh())
          setPicked(null)
          setBurst({ cells: [], n: 0 })
        }}
      />
      <div className="mx-auto grid w-full max-w-[380px] gap-4">
        <div
          ref={grid}
          className="relative grid select-none grid-cols-8 gap-1 rounded-2xl bg-surface-2 p-1.5"
          role="grid"
          aria-label="Block puzzle board"
          onPointerLeave={() => !drag && setHover(null)}
        >
          {g.board.map((v, i) => {
            const fx = burst.cells.find(([c]) => c === i)
            return (
              <button
                key={i}
                type="button"
                data-cell={i}
                aria-label={v ? 'Filled' : `Empty, row ${Math.floor(i / BLOCK) + 1} column ${(i % BLOCK) + 1}`}
                onPointerEnter={() => !drag && setHover(i)}
                onFocus={() => setHover(i)}
                onClick={() => drop(i)}
                className={cn('relative aspect-square rounded-md transition-colors duration-100', v ? 'animate-pop-in' : preview?.includes(i) ? 'bg-accent/40' : 'bg-surface')}
                style={v ? { background: PIECE_COLORS[v - 1] } : undefined}
              >
                {fx && <span key={burst.n} className="pointer-events-none absolute inset-0 animate-burst rounded-md" style={{ background: PIECE_COLORS[fx[1] - 1] }} />}
              </button>
            )
          })}
          {gain && (
            <span
              key={gain.key}
              className="pointer-events-none absolute z-10 -translate-x-1/2 animate-float-up whitespace-nowrap font-display text-lg font-bold text-fg drop-shadow"
              style={{ left: gain.x, top: gain.y }}
            >
              +{gain.n}
              {gain.lines > 1 && <span className="ml-1 text-sm text-accent-text">×{gain.lines} combo</span>}
            </span>
          )}
        </div>
        <div className="flex min-h-24 items-center justify-around gap-2" role="group" aria-label="Pieces">
          {g.tray.map((p, i) =>
            p ? (
              <button
                key={`${i}-${p.shape.length}-${p.color}`}
                data-piece={i}
                type="button"
                aria-pressed={picked === i}
                aria-label={`Piece ${i + 1}, ${p.shape.length} blocks. Drag it onto the board, or select it and tap a square.`}
                onPointerDown={onDown(i)}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={() => setDrag(null)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return
                  e.preventDefault()
                  setPicked(picked === i ? null : i)
                }}
                className={cn(
                  'grid min-h-20 min-w-20 animate-pop-in touch-none place-items-center rounded-xl border-2 p-2 transition',
                  picked === i ? 'border-accent bg-accent-soft' : 'border-transparent hover:bg-surface-2',
                  !fitsAnywhere(g.board, p.shape) && 'opacity-35',
                  ((drag?.moved && picked === i) || back?.i === i) && 'opacity-30',
                )}
              >
                <Shape shape={p.shape} color={p.color} cell={14} />
              </button>
            ) : (
              <span key={i} className="min-w-20" />
            ),
          )}
        </div>
      </div>
      {drag?.moved && piece && (
        <div className="pointer-events-none fixed z-50 drop-shadow-xl" style={{ left: drag.x, top: drag.y - drag.lift, transform: 'translate(-50%, -100%)' }}>
          <Shape shape={piece.shape} color={piece.color} cell={cellPx} gap={GAP} />
        </div>
      )}
      {back && (
        <motion.div
          className="pointer-events-none fixed left-0 top-0 z-50"
          initial={{ x: back.x, y: back.y, scale: 1, opacity: 1 }}
          animate={{ x: back.tx, y: back.ty, scale: 0.45, opacity: 0.6 }}
          transition={{ duration: 0.24, ease: [0.3, 0, 0.2, 1] }}
          onAnimationComplete={() => setBack(null)}
        >
          <div style={{ transform: 'translate(-50%, -100%)' }}>
            <Shape shape={g.tray[back.i]!.shape} color={g.tray[back.i]!.color} cell={cellPx} gap={GAP} />
          </div>
        </motion.div>
      )}
      <p className="mt-2 text-center text-xs text-subtle">Drag a piece onto the board, or tap a piece and then a square. Fill a whole row or column to clear it.</p>
    </div>
  )
}
