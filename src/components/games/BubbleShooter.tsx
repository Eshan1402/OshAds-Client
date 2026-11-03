import { useEffect, useRef, useState } from 'react'
import { cluster, floating, rowLength } from '@/lib/games'
import { buzz, PIECE_COLORS, ScoreBar, useBest } from './shared'

const COLS = 11
const R = 16
const ROW_H = R * Math.sqrt(3)
const ROWS = 12 // a bubble landing in the last row ends the game
const W = COLS * 2 * R
const H = Math.round(R + (ROWS - 1) * ROW_H + 4 * R)
const GUN = { x: W / 2, y: H - R - 4 }
const COLORS = PIECE_COLORS.slice(0, 5)
const SPEED = 10
const MISSES_PER_DROP = 6 // shots that pop nothing before two new rows push in

const randomColor = () => Math.floor(Math.random() * COLORS.length)
const newRow = (r: number) => Array.from({ length: rowLength(r, COLS) }, randomColor)
const newGrid = () => Array.from({ length: ROWS }, (_, r) => (r < 5 ? newRow(r) : Array<number>(rowLength(r, COLS)).fill(-1)))
const center = (r: number, c: number) => ({ x: R + c * 2 * R + (r % 2 ? R : 0), y: R + r * ROW_H })
/** The next shot is a colour still on the board, so every shot can be useful. */
const pickColor = (grid: number[][]) => {
  const left = [...new Set(grid.flat().filter((v) => v >= 0))]
  return left.length ? left[Math.floor(Math.random() * left.length)] : randomColor()
}

export default function BubbleShooter() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const game = useRef({ grid: newGrid(), shot: null as null | { x: number; y: number; vx: number; vy: number; color: number }, color: 0, next: 0, angle: -Math.PI / 2, misses: 0 })
  const [score, setScore] = useState(0)
  const [state, setState] = useState<'play' | 'won' | 'lost'>('play')
  const [round, setRound] = useState(0)
  const [best, record] = useBest('bubbles')

  useEffect(() => {
    const g = game.current
    g.grid = newGrid()
    g.shot = null
    g.color = pickColor(g.grid)
    g.next = pickColor(g.grid)
    g.misses = 0
    let points = 0
    let over = false
    // Popped bubbles burst in place; cut-off ones fall away. Purely visual.
    let fx: Array<{ x: number; y: number; color: number; t: number; vx: number; vy: number; fall: boolean }> = []
    const ctx = canvas.current!.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    canvas.current!.width = W * dpr
    canvas.current!.height = H * dpr
    ctx.scale(dpr, dpr)
    const ink = getComputedStyle(canvas.current!).color

    const bubble = (x: number, y: number, color: number, r = R - 1) => {
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = COLORS[color]
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x - r / 3, y - r / 3, r / 4, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.fill()
    }

    const land = (x: number, y: number, color: number) => {
      const { grid } = g
      const near = Math.round((y - R) / ROW_H)
      let spot: [number, number] | null = null
      let dist = Infinity
      for (let r = Math.max(0, near - 1); r <= Math.min(ROWS - 1, near + 1); r++)
        grid[r].forEach((v, c) => {
          const p = center(r, c)
          const d = (p.x - x) ** 2 + (p.y - y) ** 2
          if (v < 0 && d < dist) [spot, dist] = [[r, c], d]
        })
      if (!spot) return
      const [sr, sc] = spot as [number, number] // TS can't see the assignment inside forEach
      grid[sr][sc] = color
      const same = cluster(grid, sr, sc, true)
      if (same.length >= 3) {
        const gone = (cells: number[][], fall: boolean) =>
          cells.forEach(([r, c]) => {
            fx.push({ ...center(r, c), color: grid[r][c], t: 0, vx: fall ? (Math.random() - 0.5) * 3 : 0, vy: fall ? -2 - Math.random() * 2 : 0, fall })
            grid[r][c] = -1
          })
        gone(same, false)
        const fall = floating(grid)
        gone(fall, true)
        buzz(fall.length ? 40 : 18)
        points += same.length * 10 + fall.length * 20
        setScore(points)
      } else if (++g.misses >= MISSES_PER_DROP) {
        g.misses = 0
        if (grid.slice(ROWS - 3).some((row) => row.some((v) => v >= 0))) return finish('lost')
        g.grid = [newRow(0), newRow(1), ...grid.slice(0, ROWS - 2)] // two rows keep the odd/even offsets lined up
      }
      if (g.grid.flat().every((v) => v < 0)) return finish('won')
      if (g.grid[ROWS - 1].some((v) => v >= 0)) return finish('lost')
    }
    const finish = (result: 'won' | 'lost') => {
      over = true
      record(points)
      setState(result)
    }

    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(3, (now - last) / (1000 / 60)) // in 60fps frames, so speed is the same on 120Hz phones
      last = now
      const s = g.shot
      if (s) {
        const steps = Math.ceil(dt * 2)
        for (let step = 0; step < steps && g.shot; step++) {
          s.x += (s.vx * dt) / steps
          s.y += (s.vy * dt) / steps
          if (s.x < R || s.x > W - R) (s.vx = -s.vx), (s.x = Math.min(W - R, Math.max(R, s.x)))
          const hit = s.y <= R || g.grid.some((row, r) => row.some((v, c) => v >= 0 && Math.hypot(center(r, c).x - s.x, center(r, c).y - s.y) < 2 * R - 4))
          if (hit) {
            g.shot = null
            land(s.x, s.y, s.color)
            g.color = g.next
            g.next = pickColor(g.grid)
          }
        }
      }
      ctx.clearRect(0, 0, W, H)
      const lose = R + (ROWS - 1) * ROW_H - R
      ctx.strokeStyle = ink
      ctx.globalAlpha = 0.25
      ctx.setLineDash([6, 6])
      ctx.beginPath()
      ctx.moveTo(0, lose)
      ctx.lineTo(W, lose)
      ctx.stroke()
      ctx.setLineDash([])
      if (!g.shot && !over) {
        // Aim guide: dots along the real path, including the bounce off a side wall, up to the first bubble.
        let x = GUN.x
        let y = GUN.y
        let vx = Math.cos(g.angle) * 4
        const vy = Math.sin(g.angle) * 4
        ctx.fillStyle = COLORS[g.color]
        for (let k = 1; k < 140 && y > R; k++) {
          x += vx
          y += vy
          if (x < R || x > W - R) vx = -vx
          if (g.grid.some((row, r) => row.some((v, c) => v >= 0 && Math.hypot(center(r, c).x - x, center(r, c).y - y) < 2 * R - 4))) break
          if (k % 5) continue
          ctx.globalAlpha = 0.7 * (1 - k / 160)
          ctx.beginPath()
          ctx.arc(x, y, 2.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
      g.grid.forEach((row, r) => row.forEach((v, c) => v >= 0 && bubble(center(r, c).x, center(r, c).y, v)))
      fx = fx.filter((p) => {
        p.t += dt
        if (p.fall) {
          p.vy += 0.5 * dt
          p.x += p.vx * dt
          p.y += p.vy * dt
          bubble(p.x, p.y, p.color)
          return p.y < H + R
        }
        ctx.globalAlpha = Math.max(0, 1 - p.t / 14)
        bubble(p.x, p.y, p.color, (R - 1) * (1 + p.t / 20))
        ctx.globalAlpha = 1
        return p.t < 14
      })
      if (g.shot) bubble(g.shot.x, g.shot.y, g.shot.color)
      else if (!over) bubble(GUN.x, GUN.y, g.color)
      if (!over) bubble(GUN.x + 3 * R, GUN.y + 4, g.next, R * 0.6)
      if (!over || fx.length) frame = requestAnimationFrame(tick) // let the last pop finish
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [round, record])

  const aim = (clientX: number, clientY: number) => {
    const rect = canvas.current!.getBoundingClientRect()
    const x = ((clientX - rect.left) * W) / rect.width
    const y = ((clientY - rect.top) * H) / rect.height
    setAngle(Math.atan2(y - GUN.y, x - GUN.x))
  }
  // Keep shots at least ~10° above flat so they can't bounce sideways forever.
  const setAngle = (a: number) => (game.current.angle = Math.min(-0.17, Math.max(-Math.PI + 0.17, a > Math.PI / 2 ? -Math.PI + 0.17 : a)))
  const shoot = () => {
    const g = game.current
    if (g.shot || state !== 'play') return
    g.shot = { x: GUN.x, y: GUN.y, vx: Math.cos(g.angle) * SPEED, vy: Math.sin(g.angle) * SPEED, color: g.color }
  }

  return (
    <div>
      <ScoreBar
        items={[{ label: 'Score', value: score }, { label: 'Best', value: best ?? '—' }]}
        status={state === 'won' ? 'Board cleared!' : state === 'lost' ? 'The bubbles reached the line' : undefined}
        onNew={() => {
          setScore(0)
          setState('play')
          setRound((n) => n + 1)
        }}
      />
      <canvas
        ref={canvas}
        tabIndex={0}
        role="img"
        aria-label="Bubble shooter. Aim with the mouse or the left and right arrow keys, and click or press Space to shoot."
        onPointerMove={(e) => aim(e.clientX, e.clientY)}
        onPointerDown={(e) => aim(e.clientX, e.clientY)}
        onPointerUp={shoot}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault()
            setAngle(game.current.angle + (e.key === 'ArrowLeft' ? -0.06 : 0.06))
          } else if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            shoot()
          }
        }}
        className="mx-auto block w-full touch-none rounded-2xl bg-surface-2 text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"
        style={{ maxWidth: W, aspectRatio: `${W} / ${H}` }}
      />
      <p className="mt-2 text-center text-xs text-subtle">Aim and shoot. Match 3 or more of a colour to pop them; anything left hanging falls. Every few misses, the ceiling drops.</p>
    </div>
  )
}
