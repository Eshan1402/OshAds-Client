import { useEffect, useRef, useState } from 'react'
import { carryCap, FARM_H as H, FARM_W as W, GROW_S, newFarm, PADS, SPOT, stepFarm, type Crop, type Farm, type FarmPad, type FarmSave, type Worker } from '@/lib/games'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { ARROWS, buzz, ScoreBar } from './shared'

const STICK = 40 // px of drag for full speed
const SHIRTS = ['#E11D48', '#7C3AED', '#0891B2', '#EA580C', '#DB2777', '#0D9488']
const SKINS = ['#F6D2B0', '#E0A877', '#A9714B', '#7A4B2E']
const HAIRS = ['#2B1B12', '#5A3A1E', '#C58B3A', '#111827', '#B45309']
const TREES: Array<[number, number]> = [[180, 86], [26, 446], [80, 470], [338, 466]]
type Ctx = CanvasRenderingContext2D

// Fixed "random" spots for grass and flowers, so the meadow looks the same every visit.
const scatter = (() => {
  let s = 7
  return () => (s = (s * 16807) % 2147483647) / 2147483647
})()
const TUFTS = Array.from({ length: 90 }, () => [scatter() * W, scatter() * H, scatter()])
const PEBBLES = Array.from({ length: 16 }, () => [124 + scatter() * 112, 326 + scatter() * 150, 1 + scatter() * 1.6])

const oval = (c: Ctx, x: number, y: number, rx: number, ry: number, fill: string, rot = 0) => {
  c.beginPath()
  c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2)
  c.fillStyle = fill
  c.fill()
}
const dot = (c: Ctx, x: number, y: number, r: number, fill: string) => oval(c, x, y, r, r, fill)
const box = (c: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient) => {
  c.beginPath()
  c.roundRect(x, y, w, h, r)
  c.fillStyle = fill
  c.fill()
}
const fade = (c: Ctx, x0: number, y0: number, x1: number, y1: number, ...stops: string[]) => {
  const g = c.createLinearGradient(x0, y0, x1, y1)
  stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s))
  return g
}
const text = (c: Ctx, str: string, x: number, y: number, size: number, fill = '#fff') => {
  c.font = `700 ${size}px system-ui, sans-serif`
  c.textAlign = 'center'
  c.fillStyle = 'rgba(0,0,0,0.35)'
  c.fillText(str, x, y + 1)
  c.fillStyle = fill
  c.fillText(str, x, y)
}

/** A picked crop, as carried, stacked on the stall or shown in a bubble. */
function crop(c: Ctx, kind: Crop, x: number, y: number, r: number) {
  if (kind === 'tomato') {
    dot(c, x, y, r, '#E5392D')
    oval(c, x + r * 0.2, y + r * 0.3, r * 0.75, r * 0.6, 'rgba(120,10,10,0.25)')
    dot(c, x - r * 0.35, y - r * 0.35, r * 0.28, 'rgba(255,255,255,0.75)')
    oval(c, x, y - r * 0.85, r * 0.5, r * 0.22, '#2E7D32')
  } else {
    oval(c, x - r * 0.35, y, r * 0.35, r, '#E9B824', -0.25)
    oval(c, x + r * 0.35, y, r * 0.35, r, '#E9B824', 0.25)
    oval(c, x, y - r * 0.1, r * 0.38, r * 1.05, '#F7D560')
    box(c, x - r * 0.6, y + r * 0.35, r * 1.2, r * 0.3, 1, '#B45309')
  }
}

function coin(c: Ctx, x: number, y: number, r = 6) {
  oval(c, x, y + 2, r, r * 0.55, '#B7791F')
  oval(c, x, y, r, r * 0.55, '#FACC15')
  oval(c, x - r * 0.3, y - r * 0.12, r * 0.35, r * 0.14, 'rgba(255,255,255,0.8)')
}

type Look = { shirt: string; skin: string; hair?: string; bib?: string; hat?: 'straw' | 'cap' }
function person(c: Ctx, x: number, y: number, t: number, moving: boolean, face: number, look: Look) {
  const stride = moving ? Math.sin(t * 13 + x) : 0
  const bob = moving ? Math.abs(stride) * -1.6 : Math.sin(t * 2.2 + x) * 0.5
  oval(c, x, y + 14, 10, 3.6, 'rgba(0,0,0,0.2)')
  oval(c, x - 4, y + 11 - stride * 2.5, 3.6, 3, '#3B3B58') // feet
  oval(c, x + 4, y + 11 + stride * 2.5, 3.6, 3, '#3B3B58')
  dot(c, x - 9, y + 3 + bob + stride * 2, 3, look.skin) // hands
  dot(c, x + 9, y + 3 + bob - stride * 2, 3, look.skin)
  box(c, x - 8, y - 5 + bob, 16, 16, 6.5, look.shirt)
  if (look.bib) {
    box(c, x - 5.5, y + 1 + bob, 11, 10, 4, look.bib)
    box(c, x - 5.5, y - 4 + bob, 2, 6, 1, look.bib)
    box(c, x + 3.5, y - 4 + bob, 2, 6, 1, look.bib)
  }
  const hy = y - 11 + bob
  dot(c, x, hy, 7.5, look.skin)
  if (look.hair) {
    c.beginPath()
    c.arc(x, hy - 0.5, 7.8, Math.PI * 1.02, Math.PI * 1.98)
    c.fillStyle = look.hair
    c.fill()
  }
  dot(c, x + face * 2 - 2.6, hy + 1, 1.1, '#1F2937') // eyes look where they walk
  dot(c, x + face * 2 + 2.6, hy + 1, 1.1, '#1F2937')
  dot(c, x + face * 2 - 4.6, hy + 3.4, 1.4, 'rgba(244,114,128,0.45)')
  dot(c, x + face * 2 + 4.6, hy + 3.4, 1.4, 'rgba(244,114,128,0.45)')
  if (look.hat === 'straw') {
    oval(c, x, hy - 4.5, 12.5, 4.2, '#D9A93F')
    oval(c, x, hy - 5.5, 12, 3.8, '#F4D35E')
    oval(c, x, hy - 8.5, 6.5, 5, '#F4D35E')
    box(c, x - 6.3, hy - 7.6, 12.6, 2.2, 1, '#DC2626')
  } else if (look.hat === 'cap') {
    c.beginPath()
    c.arc(x, hy - 1.5, 7.9, Math.PI, 0)
    c.fillStyle = '#15803D'
    c.fill()
    oval(c, x + face * 6, hy - 1.8, 5, 1.8, '#166534')
  }
}

function tree(c: Ctx, x: number, y: number, t: number) {
  const sway = Math.sin(t * 1.3 + x) * 0.8
  oval(c, x + 3, y + 3, 18, 5.5, 'rgba(0,0,0,0.18)')
  box(c, x - 3.5, y - 10, 7, 14, 2.5, '#7A4E2D')
  dot(c, x - 10 + sway, y - 16, 11, '#2F8A3C')
  dot(c, x + 10 + sway, y - 16, 11, '#2F8A3C')
  dot(c, x + sway, y - 24, 16, '#3C9F49')
  dot(c, x - 5 + sway, y - 29, 8, '#63BF63')
  dot(c, x + 7 + sway, y - 19, 2.2, '#EF4444') // a couple of apples
  dot(c, x - 8 + sway, y - 12, 2.2, '#EF4444')
}

/** Everything that never moves, painted once and reused every frame. */
function paintGround(c: Ctx, wheat: boolean) {
  box(c, 0, 0, W, H, 0, fade(c, 0, 0, 0, H, '#97D872', '#6CBA54'))
  for (let y = 0; y < H; y += 48) box(c, 0, y, W, 24, 0, 'rgba(255,255,255,0.05)') // mown stripes
  for (const [x, y, k] of TUFTS) {
    if (k < 0.82) {
      c.strokeStyle = 'rgba(35,105,45,0.5)'
      c.lineWidth = 1.2
      c.beginPath()
      for (const lean of [-3, 0, 3]) {
        c.moveTo(x + lean, y)
        c.lineTo(x + lean * 0.4, y - 5 - (lean ? 0 : 1.5))
      }
      c.stroke()
    } else {
      const petal = k < 0.9 ? '#FFFFFF' : k < 0.96 ? '#FBCFE8' : '#FDE68A'
      for (let a = 0; a < 5; a++) dot(c, x + Math.cos(a * 1.257) * 2.6, y + Math.sin(a * 1.257) * 2.6, 1.7, petal)
      dot(c, x, y, 1.5, '#F59E0B')
    }
  }

  box(c, 114, 296, 132, H, 16, 'rgba(120,85,40,0.25)')
  box(c, 118, 296, 124, H, 14, fade(c, 118, 0, 242, 0, '#D2AD72', '#EDD3A2', '#D2AD72'))
  for (const [x, y, r] of PEBBLES) oval(c, x, y, r * 1.4, r, 'rgba(110,80,45,0.3)')

  for (const [x, locked] of [[22, false], [242, !wheat]] as const) {
    box(c, x + 2, 50, 96, 96, 14, 'rgba(0,0,0,0.18)')
    box(c, x - 2, 42, 100, 100, 14, '#5F3B22')
    box(c, x + 2, 46, 92, 92, 11, fade(c, 0, 46, 0, 138, '#9A6441', '#7F5033'))
    for (let r = 0; r < 3; r++) {
      box(c, x + 7, 68 + r * 32, 82, 6, 3, 'rgba(0,0,0,0.16)')
      box(c, x + 7, 52 + r * 32, 82, 3, 1.5, 'rgba(255,255,255,0.08)')
    }
    if (!locked) continue
    box(c, x - 2, 42, 100, 100, 14, 'rgba(108,186,84,0.6)')
    c.strokeStyle = '#F8FAFC'
    c.lineWidth = 3
    c.beginPath()
    c.arc(x + 48, 86, 7, Math.PI, 0)
    c.stroke()
    box(c, x + 37, 86, 22, 17, 4, '#F8FAFC')
    dot(c, x + 48, 94, 2.4, '#5F3B22')
  }

  // Cash mat
  box(c, SPOT.till.x - 23, SPOT.till.y - 21, 50, 50, 11, 'rgba(0,0,0,0.18)')
  box(c, SPOT.till.x - 26, SPOT.till.y - 26, 52, 52, 11, fade(c, 0, 274, 0, 326, '#3A9456', '#2B7443'))
  c.strokeStyle = 'rgba(209,250,229,0.7)'
  c.lineWidth = 1.2
  c.setLineDash([4, 3])
  c.beginPath()
  c.roundRect(SPOT.till.x - 21, SPOT.till.y - 21, 42, 42, 7)
  c.stroke()
  c.setLineDash([])

  // Stall: legs, counter top, front board and a striped trim on the customers' side
  oval(c, 180, 322, 70, 7, 'rgba(0,0,0,0.2)')
  box(c, 114, 272, 132, 34, 7, fade(c, 0, 272, 0, 306, '#E0AE66', '#C28A45'))
  c.strokeStyle = 'rgba(110,70,25,0.35)'
  c.lineWidth = 1
  c.beginPath()
  for (const x of [147, 180, 213]) {
    c.moveTo(x, 274)
    c.lineTo(x, 304)
  }
  c.stroke()
  box(c, 114, 302, 132, 16, 5, fade(c, 0, 302, 0, 318, '#9A6530', '#7A4E22'))
  for (let i = 0; i < 11; i++) {
    c.beginPath()
    c.arc(120 + i * 12, 302, 6, 0, Math.PI)
    c.fillStyle = i % 2 ? '#FFFFFF' : '#EF4444'
    c.fill()
  }
}

function paintFrame(c: Ctx, f: Farm, t: number, stick: { x: number; y: number; from: { x: number; y: number } | null }) {
  for (const p of f.plants) {
    if (p.crop === 'wheat' && !f.level.wheat) continue
    const grown = 1 - p.wait / GROW_S
    const s = 0.35 + 0.65 * grown
    const sway = Math.sin(t * 2 + p.x * 0.3 + p.y) * 0.9
    oval(c, p.x, p.y + 6, 7 * s, 2.4 * s, 'rgba(0,0,0,0.18)')
    if (p.crop === 'tomato') {
      oval(c, p.x - 4.5 * s, p.y + 2, 5.5 * s, 2.8 * s, '#2F8A3C', 0.5)
      oval(c, p.x + 4.5 * s, p.y + 2, 5.5 * s, 2.8 * s, '#2F8A3C', -0.5)
      oval(c, p.x + sway * 0.3, p.y - 1, 3 * s, 5 * s, '#46A84F')
      if (!p.wait) crop(c, 'tomato', p.x + sway * 0.4, p.y - 4 + Math.sin(t * 3 + p.x) * 0.5, 6.5)
    } else {
      c.strokeStyle = p.wait ? '#5FAE4E' : '#C99A1E'
      c.lineWidth = 1.6
      c.beginPath()
      for (const k of [-1, 0, 1]) {
        c.moveTo(p.x + k * 3, p.y + 6)
        c.lineTo(p.x + k * 5 + sway, p.y + 6 - 15 * s)
      }
      c.stroke()
      if (!p.wait) for (const k of [-1, 0, 1]) oval(c, p.x + k * 5 + sway, p.y - 11, 2.3, 5, k ? '#E9B824' : '#F7D560', k * 0.2)
    }
  }

  for (const id of Object.keys(PADS) as FarmPad[]) {
    const pad = PADS[id]
    const cost = pad.costs[f.level[id]]
    if (cost === undefined) continue
    const on = Math.hypot(f.x - pad.x, f.y - pad.y) < 26
    const fill = (52 * f.paid[id]) / cost
    box(c, pad.x - 26, pad.y - 26, 52, 52, 11, on ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.24)')
    c.save()
    c.beginPath()
    c.roundRect(pad.x - 26, pad.y - 26, 52, 52, 11)
    c.clip()
    box(c, pad.x - 26, pad.y + 26 - fill, 52, fill, 0, 'rgba(250,204,21,0.8)')
    c.restore()
    c.setLineDash([6, 4])
    c.lineDashOffset = -t * 14 // marching border draws the eye
    c.strokeStyle = '#fff'
    c.lineWidth = 1.8
    c.beginPath()
    c.roundRect(pad.x - 26, pad.y - 26, 52, 52, 11)
    c.stroke()
    c.setLineDash([])
    const [a, b] = pad.label.split(' ')
    text(c, a, pad.x, pad.y - 9, 10)
    text(c, b, pad.x, pad.y + 2, 10)
    coin(c, pad.x - 12, pad.y + 15, 4.5)
    text(c, `${cost - f.paid[id]}`, pad.x + 5, pad.y + 19, 12, '#FEF08A')
  }

  const piles = Math.min(9, Math.ceil(f.till / 5))
  for (let i = 0; i < piles; i++) coin(c, SPOT.till.x - 12 + (i % 3) * 12, SPOT.till.y + 6 - Math.floor(i / 3) * 5, 6)
  text(c, f.till ? `${f.till}` : 'CASH', SPOT.till.x, SPOT.till.y + (f.till ? 22 : 4), f.till ? 11 : 10, f.till ? '#FEF08A' : 'rgba(255,255,255,0.75)')
  f.shelf.forEach((k, i) => crop(c, k, 127 + (i % 6) * 21, 282 + Math.floor(i / 6) * 12, 6))

  // People and trees, back to front, so whoever stands lower on screen is drawn on top.
  const stack = (w: Worker) => w.carry.forEach((k, i) => crop(c, k, w.x, w.y - 30 - i * 8 + (w.moving ? Math.sin(t * 13 + i) * 0.8 : 0), 6))
  const scene: Array<[number, () => void]> = [
    ...TREES.map(([x, y]): [number, () => void] => [y, () => tree(c, x, y, t)]),
    ...f.buyers.map((b): [number, () => void] => [
      b.y,
      () => {
        const walking = b.leaving || b.y !== SPOT.queue[b.slot].y
        person(c, b.x, b.y, t, walking, 0, { shirt: SHIRTS[b.look % SHIRTS.length], skin: SKINS[b.look % SKINS.length], hair: HAIRS[b.look % HAIRS.length] })
        if (b.got) crop(c, 'tomato', b.x + 10, b.y + 5, 4)
        if (b.leaving) return
        box(c, b.x + 4, b.y - 36, 22, 16, 7, '#fff')
        c.beginPath()
        c.moveTo(b.x + 8, b.y - 22)
        c.lineTo(b.x + 6, b.y - 16)
        c.lineTo(b.x + 14, b.y - 22)
        c.fillStyle = '#fff'
        c.fill()
        c.font = '700 11px system-ui, sans-serif'
        c.textAlign = 'center'
        c.fillStyle = '#111827'
        c.fillText(`${b.want - b.got}`, b.x + 15, b.y - 24)
      },
    ]),
    ...f.helpers.map((h): [number, () => void] => [
      h.y,
      () => {
        person(c, h.x, h.y, t, h.moving, h.face, { shirt: '#F59E0B', skin: SKINS[1], bib: '#166534', hat: 'cap' })
        stack(h)
      },
    ]),
    [
      f.y,
      () => {
        person(c, f.x, f.y, t, f.moving, f.face, { shirt: '#EF4444', skin: SKINS[0], bib: '#2563EB', hat: 'straw' })
        stack(f)
      },
    ],
  ]
  scene.sort((a, b) => a[0] - b[0]).forEach(([, draw]) => draw())

  if (stick.from) {
    dot(c, stick.from.x, stick.from.y, 34, 'rgba(255,255,255,0.2)')
    c.strokeStyle = 'rgba(255,255,255,0.55)'
    c.lineWidth = 2
    c.beginPath()
    c.arc(stick.from.x, stick.from.y, 34, 0, Math.PI * 2)
    c.stroke()
    dot(c, stick.from.x + stick.x * 22, stick.from.y + stick.y * 22, 14, 'rgba(255,255,255,0.7)')
  }
}

export default function FarmStand() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [save, setSave] = useLocalStorage<FarmSave | null>('osh:games:farm', null)
  const farm = useRef(newFarm(save))
  const stick = useRef({ x: 0, y: 0, from: null as null | { x: number; y: number } })
  const keys = useRef(new Set<string>())
  const [hud, setHud] = useState({ coins: farm.current.coins, carry: 0, cap: carryCap(farm.current), sold: farm.current.sold })

  useEffect(() => {
    const el = canvas.current!
    const c = el.getContext('2d')!
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    el.width = W * dpr
    el.height = H * dpr
    c.scale(dpr, dpr)
    const ground = document.createElement('canvas')
    ground.width = el.width
    ground.height = el.height
    const gc = ground.getContext('2d')!
    gc.scale(dpr, dpr)
    const shade = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75)
    shade.addColorStop(0, 'rgba(0,0,0,0)')
    shade.addColorStop(1, 'rgba(10,40,20,0.28)')

    let frame = 0
    let last = performance.now()
    let shown = ''
    let painted = -1 // wheat level the ground was painted for
    let floats: Array<{ x: number; y: number; str: string; fill: string; age: number }> = [] // "+5" rising off a sale or pickup

    const tick = (now: number) => {
      const f = farm.current
      const k = keys.current
      const s = stick.current
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const was = { coins: f.coins, till: f.till, carry: f.carry.length, paid: Object.values(f.paid).reduce((a, b) => a + b, 0) }
      stepFarm(f, s.from ? s.x : +k.has('right') - +k.has('left'), s.from ? s.y : +k.has('down') - +k.has('up'), dt)
      if (f.till > was.till) floats.push({ x: SPOT.till.x, y: SPOT.till.y - 24, str: `+${f.till - was.till}`, fill: '#fff', age: 0 })
      if (f.coins > was.coins && !floats.some((p) => p.fill === '#FEF08A' && p.age < 0.25)) floats.push({ x: f.x, y: f.y - 40, str: `+${f.coins - was.coins}`, fill: '#FEF08A', age: 0 })
      if (f.coins !== was.coins || f.carry.length !== was.carry) buzz(6)

      if (f.level.wheat !== painted) paintGround(gc, !!(painted = f.level.wheat))
      c.drawImage(ground, 0, 0, W, H)
      paintFrame(c, f, now / 1000, s)
      floats = floats.filter((p) => (p.age += dt) < 0.9)
      for (const p of floats) {
        c.globalAlpha = 1 - p.age / 0.9
        text(c, p.str, p.x, p.y - p.age * 30, 13, p.fill)
      }
      c.globalAlpha = 1
      box(c, 0, 0, W, H, 0, shade)

      const next = `${f.coins}|${f.carry.length}|${carryCap(f)}|${f.sold}`
      if (next !== shown) {
        shown = next
        setHud({ coins: f.coins, carry: f.carry.length, cap: carryCap(f), sold: f.sold })
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    let stored = ''
    const store = () => {
      const { coins, till, sold, level, paid } = farm.current
      const json = JSON.stringify({ coins, till, sold, level, paid })
      if (json !== stored) setSave(JSON.parse((stored = json)))
    }
    const saver = window.setInterval(store, 1500)
    return () => {
      cancelAnimationFrame(frame)
      clearInterval(saver)
      store()
    }
  }, [setSave])

  const point = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height }
  }

  return (
    <div>
      <ScoreBar
        items={[{ label: 'Coins', value: hud.coins }, { label: 'Basket', value: `${hud.carry}/${hud.cap}` }, { label: 'Sold', value: hud.sold }]}
        onNew={() => {
          if (!window.confirm('Start over? Your coins, upgrades and helpers will be reset.')) return
          farm.current = newFarm()
        }}
      />
      <canvas
        ref={canvas}
        tabIndex={0}
        role="img"
        aria-label="Farm Stand. Drag anywhere, or use the arrow keys, to walk the farmer. Stand in the field to pick crops, behind the stall to stock it, on the cash mat to collect coins, and on a dashed square to buy an upgrade or hire a helper."
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          Object.assign(stick.current, { from: point(e), x: 0, y: 0 })
        }}
        onPointerMove={(e) => {
          const s = stick.current
          if (!s.from) return
          const p = point(e)
          const len = Math.max(STICK, Math.hypot(p.x - s.from.x, p.y - s.from.y))
          s.x = (p.x - s.from.x) / len
          s.y = (p.y - s.from.y) / len
        }}
        onPointerUp={() => (stick.current.from = null)}
        onPointerCancel={() => (stick.current.from = null)}
        onKeyDown={(e) => {
          const dir = ARROWS[e.key]
          if (!dir) return
          e.preventDefault()
          keys.current.add(dir)
        }}
        onKeyUp={(e) => keys.current.delete(ARROWS[e.key])}
        onBlur={() => keys.current.clear()}
        className="mx-auto block w-full touch-none select-none rounded-2xl shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-accent"
        style={{ maxWidth: W, aspectRatio: `${W} / ${H}` }}
      />
      <p className="mt-3 text-center text-xs text-subtle">Drag anywhere to walk (or use the arrow keys). Stand in the field to pick, behind the stall to stock it, on the cash mat to collect coins, and on a dashed square to buy it. Hire a helper to pick and stock for you.</p>
      <p className="mt-1 text-center text-xs text-subtle">Coins here are for this game only. They aren’t Osh coins.</p>
    </div>
  )
}
