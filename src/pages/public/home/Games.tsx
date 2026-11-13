import { Blocks, Brain, CircleDot, FlaskConical, Search, Wheat, Worm } from 'lucide-react'
import { lazy, Suspense, useState, type ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { cn } from '@/utils/cn'
import { track } from '@/lib/track'
import { Skeleton } from '@/components/ui/Feedback'
import { Eyebrow, SplitReveal } from '@/components/motion/SplitReveal'

// Each game is its own chunk: only the one being played is downloaded and running.
const GAMES: Array<{ id: string; name: string; blurb: string; icon: ReactNode; Comp: React.LazyExoticComponent<() => ReactNode> }> = [
  { id: 'wordsearch', name: 'Word Search', blurb: 'Find the hidden words', icon: <Search />, Comp: lazy(() => import('@/components/games/WordSearch')) },
  { id: 'colorsort', name: 'Color Sort', blurb: 'One colour per tube', icon: <FlaskConical />, Comp: lazy(() => import('@/components/games/ColorSort')) },
  { id: 'blocks', name: 'Block Puzzle', blurb: 'Fill rows, clear lines', icon: <Blocks />, Comp: lazy(() => import('@/components/games/BlockPuzzle')) },
  { id: 'bubbles', name: 'Bubble Shooter', blurb: 'Match three to pop', icon: <CircleDot />, Comp: lazy(() => import('@/components/games/BubbleShooter')) },
  { id: 'snake', name: 'Snake', blurb: 'Eat, grow, don’t crash', icon: <Worm />, Comp: lazy(() => import('@/components/games/Snake')) },
  { id: 'farm', name: 'Farm Stand', blurb: 'Pick, sell and grow your farm', icon: <Wheat />, Comp: lazy(() => import('@/components/games/FarmStand')) },
  { id: 'memory', name: 'Memory Match', blurb: 'Pair the app logos', icon: <Brain />, Comp: lazy(() => import('@/components/games/MemoryMatch')) },
]

export function GamesSection() {
  const [active, setActive] = useLocalStorage('osh:games:last', GAMES[0].id)
  const game = GAMES.find((g) => g.id === active) ?? GAMES[0]
  const [played, setPlayed] = useState(false) // nothing loads until the visitor picks or starts a game

  return (
    <section id="games" className="container-page py-20 sm:py-24" aria-labelledby="games-title">
      <div className="mb-10 max-w-2xl">
        <Eyebrow>Take a break</Eyebrow>
        <SplitReveal
          id="games-title"
          className="font-display text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-fg sm:text-[52px]"
          lines={['Play a quick', { text: 'game.', className: 'font-serif font-normal italic text-gradient-brand' }]}
        />
        <p className="mt-3 text-muted">Seven quick games, free, no sign-up. Your best scores are saved in this browser.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none lg:flex-col lg:overflow-visible" role="tablist" aria-label="Games">
          {GAMES.map((g) => (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={g.id === game.id}
              onClick={() => {
                setActive(g.id)
                setPlayed(true)
                track('game_start', undefined, { label: g.id })
              }}
              className={cn(
                'flex shrink-0 items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition',
                g.id === game.id ? 'border-accent/40 bg-accent-soft' : 'border-line bg-surface hover:bg-surface-2',
              )}
            >
              <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl [&>svg]:size-[18px]', g.id === game.id ? 'bg-accent text-white' : 'bg-surface-2 text-fg')}>{g.icon}</span>
              <span>
                <span className="block text-sm font-semibold text-fg">{g.name}</span>
                <span className="hidden text-xs text-subtle lg:block">{g.blurb}</span>
              </span>
            </button>
          ))}
        </div>

        <div
          key={game.id}
          className="min-w-0 animate-fade-up touch-manipulation rounded-[24px] border border-line bg-surface p-4 [-webkit-tap-highlight-color:transparent] sm:p-6"
          role="tabpanel"
          aria-label={game.name}
        >
          {played ? (
            <Suspense fallback={<Skeleton className="mx-auto h-[420px] max-w-[400px] rounded-2xl" />}>
              <game.Comp />
            </Suspense>
          ) : (
            <div className="grid min-h-[320px] place-items-center text-center">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-white [&>svg]:size-7">{game.icon}</span>
                <p className="mt-4 font-display text-xl font-semibold text-fg">{game.name}</p>
                <p className="mt-1 text-sm text-muted">{game.blurb}</p>
                <button
                  type="button"
                  onClick={() => {
                    setPlayed(true)
                    track('game_start', undefined, { label: game.id })
                  }}
                  className="mt-5 inline-flex h-11 items-center rounded-full bg-fg px-6 text-sm font-semibold text-bg transition active:scale-[0.97]">
                  Play {game.name}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
