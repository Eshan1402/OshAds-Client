import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { placeFood, stepSnake, type Dir } from '@/lib/games'
import { cn } from '@/utils/cn'
import { ARROWS, buzz, ScoreBar, useBest, useSwipe } from './shared'

const SIZE = 16
const TICK_MS = 120
const OPPOSITE: Record<Dir, Dir> = { left: 'right', right: 'left', up: 'down', down: 'up' }
const HEADING: Record<Dir, number> = { right: 0, down: 90, left: 180, up: 270 }
const start = () => {
  const snake = [SIZE * 8 + 5, SIZE * 8 + 4, SIZE * 8 + 3]
  return { snake, food: placeFood(snake, SIZE), dir: 'right' as Dir }
}

export default function Snake() {
  const [state, setState] = useState(start)
  const [running, setRunning] = useState(false)
  const [over, setOver] = useState(false)
  const [gen, setGen] = useState(0) // new game: segments jump to the start instead of gliding there
  const [best, record] = useBest('snake')
  const board = useRef<HTMLDivElement>(null)
  const nextDir = useRef<Dir>('right') // latest key press; applied on the next tick so two quick presses can't reverse the snake
  const score = state.snake.length - 3

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      if (document.hidden) return
      setState((s) => {
        const dir = nextDir.current === OPPOSITE[s.dir] ? s.dir : nextDir.current
        const r = stepSnake(s.snake, dir, SIZE, s.food)
        if (r.dead) {
          setRunning(false)
          setOver(true)
          buzz(60)
          return s
        }
        if (r.ate) buzz(15)
        return { snake: r.snake, dir, food: r.ate ? placeFood(r.snake, SIZE) : s.food }
      })
    }, TICK_MS)
    return () => clearInterval(t)
  }, [running])

  useEffect(() => {
    if (over) record(score)
  }, [over, score, record])

  const steer = (d: Dir) => {
    nextDir.current = d
    if (!over) setRunning(true) // tapping the on-screen pad blurs the board (pausing it); steering resumes
  }
  const restart = () => {
    const s = start()
    nextDir.current = s.dir
    setState(s)
    setOver(false)
    setGen((n) => n + 1)
    setRunning(true)
    board.current?.focus()
  }
  const swipe = useSwipe(steer)

  return (
    <div>
      <ScoreBar
        items={[{ label: 'Score', value: score }, { label: 'Best', value: best ?? '—' }]}
        status={over ? `Game over · ${score}` : !running ? 'Paused' : undefined}
        onNew={restart}
      />
      <div className="relative mx-auto w-full max-w-[380px]">
        <div
          ref={board}
          tabIndex={0}
          role="application"
          aria-label="Snake board. Use the arrow keys or swipe to steer."
          onKeyDown={(e) => {
            if (e.key === ' ') {
              e.preventDefault()
              return over ? restart() : setRunning((r) => !r)
            }
            const d = ARROWS[e.key]
            if (!d) return
            e.preventDefault()
            steer(d)
          }}
          onBlur={() => setRunning(false)}
          {...swipe}
          className="relative aspect-square touch-none select-none overflow-hidden rounded-2xl bg-surface outline-none ring-accent focus-visible:ring-2"
          style={{
            backgroundImage: 'linear-gradient(rgb(127 127 127 / 0.1) 1px, transparent 1px), linear-gradient(90deg, rgb(127 127 127 / 0.1) 1px, transparent 1px)',
            backgroundSize: `${100 / SIZE}% ${100 / SIZE}%`,
          }}
        >
          {/* Each segment slides to its next square over one tick, so the snake glides instead of jumping. */}
          {state.snake.map((cell, i) => (
            <div
              key={`${gen}-${i}`}
              className={cn('absolute left-0 top-0 p-px', i === 0 ? 'z-10' : '')}
              style={{
                width: `${100 / SIZE}%`,
                height: `${100 / SIZE}%`,
                transform: `translate(${(cell % SIZE) * 100}%, ${Math.floor(cell / SIZE) * 100}%)`,
                transition: `transform ${TICK_MS}ms linear`,
              }}
            >
              {i === 0 ? (
                // Head with eyes facing the way it's going.
                <div className="relative size-full rounded-[5px] bg-accent" style={{ transform: `rotate(${HEADING[state.dir]}deg)` }}>
                  <span className="absolute right-[18%] top-[18%] size-[22%] rounded-full bg-white" />
                  <span className="absolute bottom-[18%] right-[18%] size-[22%] rounded-full bg-white" />
                </div>
              ) : (
                <div className="size-full rounded-[4px] bg-accent/70" style={{ opacity: 1 - (i / state.snake.length) * 0.35 }} />
              )}
            </div>
          ))}
          <div
            key={state.food}
            className="absolute left-0 top-0 p-[3px]"
            style={{ width: `${100 / SIZE}%`, height: `${100 / SIZE}%`, transform: `translate(${(state.food % SIZE) * 100}%, ${Math.floor(state.food / SIZE) * 100}%)` }}
          >
            <div className="size-full animate-pop-in rounded-full bg-[#F59E0B]" />
          </div>
        </div>
        {!running && (
          <button
            type="button"
            onClick={over ? restart : () => (setRunning(true), board.current?.focus())}
            className="absolute inset-0 m-auto inline-flex h-11 w-fit items-center gap-2 rounded-full bg-fg px-5 text-sm font-semibold text-bg shadow-lg active:scale-[0.97]"
          >
            <Play className="size-4" aria-hidden /> {over ? 'Play again' : score ? 'Resume' : 'Start'}
          </button>
        )}
      </div>
      {/* On-screen pad for phones. It steers on touch-down (no wait for the tap to end) and keeps focus on the board so play doesn't pause. */}
      <div className="mx-auto mt-4 grid w-36 grid-cols-3 gap-1.5 sm:hidden">
        {(
          [
            ['up', <ArrowUp key="u" />, 'col-start-2'],
            ['left', <ArrowLeft key="l" />, 'col-start-1 row-start-2'],
            ['down', <ArrowDown key="d" />, 'col-start-2 row-start-2'],
            ['right', <ArrowRight key="r" />, 'col-start-3 row-start-2'],
          ] as const
        ).map(([d, icon, pos]) => (
          <button key={d} type="button" aria-label={`Move ${d}`} onPointerDown={(e) => (e.preventDefault(), steer(d))} onClick={() => steer(d)} className={cn('grid size-12 touch-manipulation place-items-center rounded-xl border border-line bg-surface transition active:scale-90 active:bg-surface-2 [&>svg]:size-5', pos)}>
            {icon}
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-subtle">Arrow keys or swipe to steer · Space to pause · eat the orange dots.</p>
    </div>
  )
}
