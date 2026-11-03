import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { canPour, dealTubes, pour, sortedTubes, TUBE } from '@/lib/games'
import { buzz, PIECE_COLORS, ScoreBar, useBest } from './shared'

const COLORS = 5
const TILT = 72 // degrees the bottle leans while pouring
const MOVE = 0.38 // s: lift and travel, and the trip back
const FLOW = 0.55 // s: liquid running from one bottle to the other
const PAD = 5 // px of glass around the liquid
const ease = [0.45, 0, 0.25, 1] as const

type Pour = { from: number; to: number; x: number; y: number; rotate: number; color: number; stream: { left: number; top: number; height: number } | null; back: boolean }

/** Consecutive units of one colour as a single band, so the liquid reads as one body, not blocks. */
const bands = (t: number[]) =>
  t.reduce<Array<{ color: number; n: number; at: number }>>((out, c, k) => {
    const last = out.at(-1)
    if (last?.color === c) last.n++
    else out.push({ color: c, n: 1, at: k })
    return out
  }, [])

// Side shading so the colour looks like it's inside a round glass tube.
const liquid = (c: string) => `linear-gradient(90deg, color-mix(in srgb, ${c} 70%, black) 0%, ${c} 30%, color-mix(in srgb, ${c} 75%, white) 62%, ${c} 85%, color-mix(in srgb, ${c} 80%, black) 100%)`

export default function ColorSort() {
  const [tubes, setTubes] = useState(() => dealTubes(COLORS))
  const [picked, setPicked] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [bad, setBad] = useState<number | null>(null) // tube that refused a pour, shaken briefly
  const [anim, setAnim] = useState<Pour | null>(null)
  const [best, record] = useBest('colorsort', 'lower')
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const timers = useRef<number[]>([])
  const reduce = useReducedMotion()
  const won = sortedTubes(tubes)
  const stuck = !won && !canPour(tubes)

  useEffect(() => {
    if (won) record(moves)
  }, [won, moves, record])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const commit = (next: number[][], to: number) => {
    setTubes(next)
    setMoves((m) => m + 1)
    buzz(sortedTubes([next[to]]) && next[to].length === TUBE ? 40 : 10)
  }

  const tap = (i: number) => {
    if (won || anim) return
    if (picked === null) return tubes[i].length && setPicked(i)
    const from = picked
    setPicked(null)
    const next = pour(tubes, from, i)
    if (!next) {
      if (from === i) return
      setBad(i)
      timers.current.push(window.setTimeout(() => setBad(null), 360))
      return
    }
    const a = refs.current[from]
    const b = refs.current[i]
    if (reduce || !a || !b) return commit(next, i)

    // Layout positions (offset*, not getBoundingClientRect) so the lifted/tilted transform doesn't skew the maths.
    const dir = b.offsetLeft > a.offsetLeft ? 1 : -1
    const rad = (TILT * Math.PI) / 180
    const h = a.offsetHeight
    const mouth = { x: b.offsetLeft + b.offsetWidth / 2, y: b.offsetTop - 10 } // where the source's mouth ends up
    const x = mouth.x - dir * Math.sin(rad) * (h / 2) - (a.offsetLeft + a.offsetWidth / 2)
    const y = mouth.y + Math.cos(rad) * (h / 2) - (a.offsetTop + h / 2)
    const inner = b.offsetHeight - 2 * PAD
    const surface = b.offsetTop + b.offsetHeight - PAD - (inner * next[i].length) / TUBE
    const stream = { left: mouth.x - 3, top: mouth.y, height: surface - mouth.y }
    const color = tubes[from].at(-1)!

    setAnim({ from, to: i, x, y, rotate: dir * TILT, color, stream: null, back: false })
    timers.current.push(
      window.setTimeout(() => {
        setAnim((p) => p && { ...p, stream })
        commit(next, i)
      }, MOVE * 1000),
      window.setTimeout(() => setAnim((p) => p && { ...p, stream: null, back: true }), (MOVE + FLOW) * 1000),
      window.setTimeout(() => setAnim(null), (2 * MOVE + FLOW) * 1000),
    )
  }

  return (
    <div>
      <ScoreBar
        items={[{ label: 'Moves', value: moves }, { label: 'Best', value: best ?? '—' }]}
        status={won ? `Sorted in ${moves} moves` : stuck ? 'No moves left' : undefined}
        onNew={() => {
          timers.current.forEach(clearTimeout)
          setAnim(null)
          setTubes(dealTubes(COLORS))
          setPicked(null)
          setMoves(0)
        }}
      />
      <div className="relative mx-auto flex max-w-[420px] flex-wrap justify-center gap-2 pb-4 pt-16 sm:gap-3" role="group" aria-label="Bottles">
        {tubes.map((t, i) => {
          const moving = anim?.from === i
          const full = t.length === TUBE && sortedTubes([t])
          return (
            <motion.button
              key={i}
              ref={(el) => void (refs.current[i] = el)}
              type="button"
              onClick={() => tap(i)}
              aria-pressed={picked === i}
              aria-label={`Bottle ${i + 1}: ${t.length ? `${t.length} of ${TUBE} filled` : 'empty'}`}
              animate={
                moving && !anim.back
                  ? { x: anim.x, y: anim.y, rotate: anim.rotate }
                  : bad === i
                    ? { x: [0, -6, 6, -4, 4, 0], y: 0, rotate: 0 }
                    : { x: 0, y: picked === i ? -16 : 0, rotate: 0 }
              }
              transition={bad === i ? { duration: 0.35 } : { duration: moving ? MOVE : 0.2, ease }}
              style={{ zIndex: moving ? 20 : picked === i ? 10 : 0 }}
              className="relative h-40 w-9 rounded-b-[18px] rounded-t-[6px] border-2 border-line-strong bg-surface-2/50 shadow-[inset_0_-6px_12px_rgb(0_0_0/0.08)] sm:w-11 sm:rounded-b-[22px]"
            >
              <span
                className="absolute flex flex-col-reverse overflow-hidden rounded-b-[14px] rounded-t-[3px] sm:rounded-b-[18px]"
                style={{ inset: PAD - 2 }}
              >
                <AnimatePresence initial={false}>
                  {bands(t).map((band) => (
                    <motion.span
                      key={`${band.at}-${band.color}`}
                      className="relative block w-full shrink-0"
                      style={{ background: liquid(PIECE_COLORS[band.color]) }}
                      initial={{ height: 0 }}
                      animate={{ height: `${(band.n / TUBE) * 100}%` }}
                      exit={{ height: 0 }}
                      transition={{ duration: FLOW, ease: 'easeInOut' }}
                    >
                      {/* lighter surface line on top of each colour */}
                      <span className="absolute inset-x-0 top-0 h-[3px] bg-white/25" />
                    </motion.span>
                  ))}
                </AnimatePresence>
              </span>
              {/* glass highlight */}
              <span className="pointer-events-none absolute bottom-3 left-[18%] top-2 w-[3px] rounded-full bg-white/35" />
              {full && <span className="pointer-events-none absolute -inset-[2px] rounded-[inherit] ring-2 ring-[#16A34A]" />}
            </motion.button>
          )
        })}
        <AnimatePresence>
          {anim?.stream && (
            <motion.span
              key="stream"
              aria-hidden
              className="pointer-events-none absolute z-30 w-1.5 origin-top rounded-full"
              style={{ left: anim.stream.left, top: anim.stream.top, height: anim.stream.height, background: PIECE_COLORS[anim.color] }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              exit={{ scaleY: 0, originY: 1, opacity: 0.6 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
      </div>
      <p className="mt-2 text-center text-xs text-subtle">Tap a bottle, then another, to pour. Colour goes onto the same colour or into an empty bottle. Fill each bottle with one colour.</p>
    </div>
  )
}
