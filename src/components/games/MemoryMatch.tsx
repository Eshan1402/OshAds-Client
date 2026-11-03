import { useEffect, useState } from 'react'
import { apps } from '@/data/apps'
import { cn } from '@/utils/cn'
import { buzz, ScoreBar, useBest } from './shared'

const PAIRS = 8
// The cards are client logos, so the game doubles as a look at the catalogue.
const logos = apps.filter((a) => a.iconImage)

function deal() {
  const pick = [...logos].sort(() => Math.random() - 0.5).slice(0, PAIRS)
  return [...pick, ...pick].map((a, i) => ({ key: i, id: a.id, name: a.name, src: a.iconImage! })).sort(() => Math.random() - 0.5)
}

export default function MemoryMatch() {
  const [cards, setCards] = useState(deal)
  const [up, setUp] = useState<number[]>([]) // indexes of the (at most two) cards turned over
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [moves, setMoves] = useState(0)
  const [best, record] = useBest('memory', 'lower')
  const done = matched.size === PAIRS

  useEffect(() => {
    if (up.length < 2) return
    const [a, b] = up
    if (cards[a].id === cards[b].id) {
      buzz(25)
      setMatched((m) => new Set(m).add(cards[a].id))
      setUp([])
      return
    }
    const t = setTimeout(() => setUp([]), 750)
    return () => clearTimeout(t)
  }, [up, cards])

  useEffect(() => {
    if (done) record(moves)
  }, [done, moves, record])

  const flip = (i: number) => {
    if (up.length === 2 || up.includes(i) || matched.has(cards[i].id)) return
    if (up.length === 1) setMoves((m) => m + 1)
    setUp([...up, i])
  }

  return (
    <div>
      <ScoreBar
        items={[{ label: 'Moves', value: moves }, { label: 'Pairs', value: `${matched.size}/${PAIRS}` }, { label: 'Best', value: best ?? '—' }]}
        status={done ? `Solved in ${moves} moves` : undefined}
        onNew={() => {
          setCards(deal())
          setUp([])
          setMatched(new Set())
          setMoves(0)
        }}
      />
      <div className="mx-auto grid w-full max-w-[400px] grid-cols-4 gap-2.5" role="grid" aria-label="Memory cards">
        {cards.map((c, i) => {
          const shown = up.includes(i) || matched.has(c.id)
          const miss = up.length === 2 && up.includes(i) && cards[up[0]].id !== cards[up[1]].id
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => flip(i)}
              aria-label={shown ? c.name : 'Hidden card'}
              className={cn('aspect-square transition active:scale-95 [perspective:600px]', miss && 'animate-shake [animation-delay:300ms]')}
            >
              <span
                className={cn(
                  'relative block size-full rounded-2xl transition-transform duration-300 [transform-style:preserve-3d] motion-reduce:transition-none',
                  shown && '[transform:rotateY(180deg)]',
                )}
              >
                <span className="absolute inset-0 grid place-items-center rounded-2xl border border-line bg-accent-soft font-display text-2xl font-bold text-accent-text [backface-visibility:hidden]">
                  ?
                </span>
                <span
                  className={cn(
                    'absolute inset-0 grid place-items-center rounded-2xl border bg-surface [backface-visibility:hidden] [transform:rotateY(180deg)]',
                    matched.has(c.id) ? 'border-[#16A34A]' : 'border-line',
                  )}
                >
                  <img src={c.src} alt="" className="size-3/5 rounded-[22%] bg-white object-cover" draggable={false} />
                </span>
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-center text-xs text-subtle">Turn over two cards at a time and find all {PAIRS} pairs of app logos.</p>
    </div>
  )
}
