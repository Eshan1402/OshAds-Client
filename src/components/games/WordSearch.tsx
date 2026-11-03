import { motion } from 'framer-motion'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { lineCells, placeWords } from '@/lib/games'
import { cn } from '@/utils/cn'
import { buzz, PIECE_COLORS, ScoreBar, useBest } from './shared'

const SIZE = 10
const COUNT = 6
const BANK = ('APPLE MANGO GRAPE LEMON PEACH BERRY MELON CHERRY ' +
  'TIGER ZEBRA PANDA EAGLE SHARK WHALE HORSE RABBIT ' +
  'PHONE MUSIC RADIO CAMERA ROBOT PIXEL ' +
  'OCEAN RIVER CLOUD STORM PLANET COMET ' +
  'BREAD CANDY HONEY PIZZA PASTA TOAST ' +
  'PIANO GUITAR DANCE PAINT BOOK CHESS').split(' ')

const newRound = () => placeWords([...BANK].sort(() => Math.random() - 0.5).slice(0, COUNT), SIZE)
const cellAt = (x: number, y: number) => {
  const el = document.elementFromPoint(x, y) as HTMLElement | null
  const i = el?.dataset.cell
  return i === undefined ? null : Number(i)
}

export default function WordSearch() {
  const [round, setRound] = useState(newRound)
  const [found, setFound] = useState<string[]>([])
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null)
  const [anchor, setAnchor] = useState<number | null>(null) // first letter of a tap-tap selection
  const [started, setStarted] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [best, record] = useBest('wordsearch', 'lower')
  const grid = useRef<HTMLDivElement>(null)
  const done = found.length === round.placed.length
  const seconds = started ? Math.floor((now - started) / 1000) : 0

  useEffect(() => {
    if (!started || done) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [started, done])

  useEffect(() => {
    if (done && started) record(seconds) // the clock stops when the last word is found
  }, [done, started, seconds, record])

  /** Counts the line from a to b if it spells a hidden word, forwards or backwards. */
  const check = (a: number, b: number) => {
    const cells = lineCells(a, b, SIZE)
    if (!cells) return
    const key = cells.join()
    const rev = [...cells].reverse().join()
    const hit = round.placed.find((p) => !found.includes(p.word) && (p.cells.join() === key || p.cells.join() === rev))
    if (hit) {
      buzz(found.length + 1 === round.placed.length ? 60 : 20)
      setFound([...found, hit.word])
      setNow(Date.now())
    }
  }

  const down = (e: PointerEvent) => {
    const i = cellAt(e.clientX, e.clientY)
    if (i === null || done) return
    if (!started) {
      setStarted(Date.now())
      setNow(Date.now())
    }
    if (anchor !== null && anchor !== i) {
      check(anchor, i)
      setAnchor(null)
      return
    }
    grid.current?.setPointerCapture(e.pointerId)
    setDrag({ from: i, to: i })
  }
  const move = (e: PointerEvent) => {
    if (!drag) return
    const i = cellAt(e.clientX, e.clientY)
    if (i !== null && i !== drag.to) setDrag({ ...drag, to: i })
  }
  const up = () => {
    if (!drag) return
    if (drag.from === drag.to) setAnchor(anchor === drag.from ? null : drag.from)
    else {
      check(drag.from, drag.to)
      setAnchor(null)
    }
    setDrag(null)
  }

  const selecting = new Set(drag ? lineCells(drag.from, drag.to, SIZE) ?? [drag.from] : anchor !== null ? [anchor] : [])
  const selLine = drag ? (lineCells(drag.from, drag.to, SIZE) ?? [drag.from]) : null

  // shortcut: highlight positions are measured on render, so after a screen rotation they catch up on the next touch.
  const at = (i: number) => {
    const el = grid.current?.children[i] as HTMLElement | undefined
    return el && { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2, w: el.offsetWidth }
  }
  /** A rounded marker stroke over a run of letters, like circling a word on paper. */
  const capsule = (cells: number[], color: string, key: string, opacity: number, drawIn: boolean) => {
    const a = at(cells[0])
    const b = at(cells.at(-1)!)
    if (!a || !b) return null
    return (
      <motion.line
        key={key}
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth={a.w * 0.84}
        strokeLinecap="round"
        initial={drawIn ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      />
    )
  }

  return (
    <div>
      <ScoreBar
        items={[
          { label: 'Found', value: `${found.length}/${round.placed.length}` },
          { label: 'Time', value: `${seconds}s` },
          { label: 'Best', value: best === null ? '—' : `${best}s` },
        ]}
        status={done ? `All found in ${seconds}s` : undefined}
        onNew={() => {
          setRound(newRound())
          setFound([])
          setAnchor(null)
          setStarted(null)
        }}
      />
      <div className="mx-auto grid w-full max-w-[420px] gap-4">
        <div
          ref={grid}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={() => setDrag(null)}
          role="grid"
          aria-label="Word search grid. Drag from the first letter of a word to its last, or tap both."
          className="relative grid touch-none select-none gap-1 rounded-2xl bg-surface-2 p-2"
          style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}
        >
          {round.grid.map((ch, i) => (
            <div
              key={i}
              data-cell={i}
              className={cn(
                'relative z-10 grid aspect-square place-items-center font-display text-[15px] font-bold transition duration-100 sm:text-lg',
                selecting.has(i) ? 'scale-110 text-white' : 'text-fg',
              )}
            >
              {ch}
            </div>
          ))}
          <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden>
            {round.placed.map((p, k) => found.includes(p.word) && capsule(p.cells, PIECE_COLORS[k % PIECE_COLORS.length], p.word, 0.45, true))}
            {selLine && capsule(selLine, 'var(--accent)', 'sel', 0.9, false)}
            {!drag && anchor !== null && capsule([anchor], 'var(--accent)', 'anchor', 0.9, false)}
          </svg>
        </div>
        <ul className="flex flex-wrap justify-center gap-2" aria-label="Words to find">
          {round.placed.map((p) => (
            <li
              key={p.word}
              className={cn(
                'rounded-full border px-3 py-1 text-sm font-semibold tracking-wide',
                found.includes(p.word) ? 'animate-pop-in border-transparent bg-[#16A34A]/15 text-[#16A34A] line-through' : 'border-line text-fg',
              )}
            >
              {p.word}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-center text-xs text-subtle">Words run across, down or diagonally, forwards or backwards. Drag across a word, or tap its first and last letter.</p>
    </div>
  )
}
