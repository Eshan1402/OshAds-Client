/** Rules for the home-page mini games, kept free of React so they can be tested. */

type Rnd = () => number

export type Dir = 'left' | 'right' | 'up' | 'down'

/* ── Word search: a size×size grid of letters, cells as indexes ── */

const DIRS: Array<[number, number]> = [[1, 0], [0, 1], [1, 1], [1, -1], [-1, 0], [0, -1], [-1, -1], [-1, 1]]
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/**
 * Hides words in any of the 8 directions (so also backwards). Words may cross where letters agree.
 * A word that doesn't fit after 200 tries is left out; `placed` lists the words actually hidden.
 */
export function placeWords(words: string[], size: number, rnd: Rnd = Math.random) {
  const grid: string[] = Array(size * size).fill('')
  const placed: Array<{ word: string; cells: number[] }> = []
  for (const word of words) {
    for (let tries = 0; tries < 200; tries++) {
      const [dx, dy] = DIRS[Math.floor(rnd() * DIRS.length)]
      const x0 = Math.floor(rnd() * size)
      const y0 = Math.floor(rnd() * size)
      const xs = [...word].map((_, k) => [x0 + dx * k, y0 + dy * k])
      if (xs.some(([x, y]) => x < 0 || y < 0 || x >= size || y >= size)) continue
      const cells = xs.map(([x, y]) => y * size + x)
      if (cells.some((c, k) => grid[c] && grid[c] !== word[k])) continue
      cells.forEach((c, k) => (grid[c] = word[k]))
      placed.push({ word, cells })
      break
    }
  }
  return { grid: grid.map((ch) => ch || ABC[Math.floor(rnd() * 26)]), placed }
}

/** Cells on the straight line from a to b (row, column or 45° diagonal), or null if it isn't one. */
export function lineCells(a: number, b: number, size: number) {
  const ax = a % size, ay = Math.floor(a / size), bx = b % size, by = Math.floor(b / size)
  const dx = Math.sign(bx - ax), dy = Math.sign(by - ay)
  const len = Math.max(Math.abs(bx - ax), Math.abs(by - ay))
  if (ax !== bx && ay !== by && Math.abs(bx - ax) !== Math.abs(by - ay)) return null
  return Array.from({ length: len + 1 }, (_, k) => (ay + dy * k) * size + ax + dx * k)
}

/* ── Snake: cells are indexes on a size×size grid, head first ── */

const STEP: Record<Dir, [number, number]> = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }

export function stepSnake(snake: number[], dir: Dir, size: number, food: number) {
  const x = (snake[0] % size) + STEP[dir][0]
  const y = Math.floor(snake[0] / size) + STEP[dir][1]
  const head = y * size + x
  const ate = head === food
  const body = ate ? snake : snake.slice(0, -1) // the tail moves away this step unless the snake grows
  const dead = x < 0 || y < 0 || x >= size || y >= size || body.includes(head)
  return { snake: [head, ...body], ate, dead }
}

export function placeFood(snake: number[], size: number, rnd: Rnd = Math.random) {
  const taken = new Set(snake)
  const free = Array.from({ length: size * size }, (_, i) => i).filter((i) => !taken.has(i))
  return free.length ? free[Math.floor(rnd() * free.length)] : -1
}

const shuffle = <T>(a: T[], rnd: Rnd) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ── Color sort: tubes of colour numbers, bottom first ── */

export const TUBE = 4

/** `colors` full tubes' worth of colour mixed across tubes, plus two empty tubes to work with. */
export function dealTubes(colors: number, rnd: Rnd = Math.random): number[][] {
  const units = shuffle(Array.from({ length: colors * TUBE }, (_, i) => i % colors), rnd)
  return [...Array.from({ length: colors }, (_, t) => units.slice(t * TUBE, t * TUBE + TUBE)), [], []]
}

/** Pours the top run of `from` into `to` (as much as fits), or returns null if that move isn't allowed. */
export function pour(tubes: number[][], from: number, to: number): number[][] | null {
  const a = tubes[from]
  const b = tubes[to]
  const top = a.at(-1)
  if (from === to || top === undefined || b.length === TUBE || (b.length && b.at(-1) !== top)) return null
  let run = 0
  while (a[a.length - 1 - run] === top) run++
  const n = Math.min(run, TUBE - b.length)
  return tubes.map((t, i) => (i === from ? t.slice(0, -n) : i === to ? [...t, ...Array(n).fill(top)] : t))
}

export const sortedTubes = (tubes: number[][]) => tubes.every((t) => !t.length || (t.length === TUBE && t.every((c) => c === t[0])))
export const canPour = (tubes: number[][]) => tubes.some((_, a) => tubes.some((_, b) => pour(tubes, a, b)))

/* ── Block puzzle: an 8×8 board, 0 = empty, otherwise a colour number ── */

export const BLOCK = 8
/** Piece shapes as [row, col] cells. */
export const SHAPES: Array<Array<[number, number]>> = [
  [[0, 0]],
  [[0, 0], [0, 1]], [[0, 0], [1, 0]],
  [[0, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
  [[0, 0], [1, 0], [1, 1]], [[0, 1], [1, 0], [1, 1]], [[0, 0], [0, 1], [1, 0]], [[0, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [2, 1]], [[0, 0], [0, 1], [0, 2], [1, 1]], [[0, 1], [1, 0], [1, 1], [1, 2]],
  [[0, 0], [0, 1], [1, 1], [1, 2]], [[0, 1], [0, 2], [1, 0], [1, 1]],
]

/** Board indexes the shape would cover with its top-left at `at`, or null if it goes off the board or overlaps. */
export function fit(board: number[], shape: Array<[number, number]>, at: number) {
  const r0 = Math.floor(at / BLOCK)
  const c0 = at % BLOCK
  const cells = shape.map(([r, c]) => (r0 + r >= BLOCK || c0 + c >= BLOCK ? -1 : (r0 + r) * BLOCK + c0 + c))
  return cells.every((i) => i >= 0 && !board[i]) ? cells : null
}

/** Places the cells, then clears every full row and column at once. */
export function placeBlock(board: number[], cells: number[], color: number) {
  const next = board.map((v, i) => (cells.includes(i) ? color : v))
  const full = new Set<number>()
  let lines = 0
  for (let k = 0; k < BLOCK; k++) {
    const row = Array.from({ length: BLOCK }, (_, j) => k * BLOCK + j)
    const col = Array.from({ length: BLOCK }, (_, j) => j * BLOCK + k)
    for (const line of [row, col]) if (line.every((i) => next[i])) (lines++, line.forEach((i) => full.add(i)))
  }
  return { board: next.map((v, i) => (full.has(i) ? 0 : v)), lines }
}

export const fitsAnywhere = (board: number[], shape: Array<[number, number]>) => board.some((_, i) => fit(board, shape, i))

/* ── Bubble shooter: rows of colours (-1 = empty); odd rows are shifted half a bubble and hold one fewer ── */

export const rowLength = (r: number, cols: number) => cols - (r % 2)

export function hexNeighbours(r: number, c: number, grid: number[][]) {
  const d = r % 2 ? [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]] : [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]]
  return d.map(([dr, dc]) => [r + dr, c + dc]).filter(([nr, nc]) => nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[nr].length)
}

/** Connected cells from (r, c): all filled ones, or only those with the same colour. */
export function cluster(grid: number[][], r: number, c: number, sameColor: boolean) {
  const seen = new Set([`${r},${c}`])
  const stack = [[r, c]]
  const out: number[][] = []
  while (stack.length) {
    const [cr, cc] = stack.pop()!
    out.push([cr, cc])
    for (const [nr, nc] of hexNeighbours(cr, cc, grid)) {
      const v = grid[nr][nc]
      if (v < 0 || seen.has(`${nr},${nc}`) || (sameColor && v !== grid[r][c])) continue
      seen.add(`${nr},${nc}`)
      stack.push([nr, nc])
    }
  }
  return out
}

/** Filled cells no longer connected to the top row: they fall. */
export function floating(grid: number[][]) {
  const held = new Set<string>()
  grid[0].forEach((v, c) => v >= 0 && cluster(grid, 0, c, false).forEach(([r, k]) => held.add(`${r},${k}`)))
  return grid.flatMap((row, r) => row.flatMap((v, c) => (v >= 0 && !held.has(`${r},${c}`) ? [[r, c]] : [])))
}

/* ── Farm Stand: steer a farmer around a small field. Nothing is tapped: picking, stocking, selling and buying happen by standing close. ── */

export const FARM_W = 360
export const FARM_H = 480
export type Crop = 'tomato' | 'wheat'
export const CROP_PRICE: Record<Crop, number> = { tomato: 5, wheat: 9 }
/** Where to stand: behind the stall to stock it, on the mat to pick up takings. Customers queue in front. */
export const SPOT = { stall: { x: 180, y: 262 }, till: { x: 300, y: 300 }, queue: [{ x: 140, y: 350 }, { x: 180, y: 350 }, { x: 220, y: 350 }] }
/** Purchase pads: stand on one and coins drain into it; each entry in `costs` is one level. */
export const PADS = {
  wheat: { x: 290, y: 190, costs: [60], label: 'Wheat field' },
  basket: { x: 48, y: 230, costs: [80, 160, 320], label: 'Bigger basket' },
  shoes: { x: 48, y: 330, costs: [120, 240], label: 'Faster shoes' },
  helper: { x: 300, y: 400, costs: [150, 400], label: 'Hire helper' },
}
export type FarmPad = keyof typeof PADS
export const SHELF_CAP = 12
export const GROW_S = 5
const HELPER_CAP = 3

/** The part worth keeping between visits. */
export type FarmSave = { coins: number; till: number; sold: number; level: Record<FarmPad, number>; paid: Record<FarmPad, number> }
/** Anyone who carries crops: the farmer and the hired helpers. */
export type Worker = {
  x: number
  y: number
  carry: Crop[]
  act: number // pause between two picks or two drops, so the stack builds one by one
  face: 1 | -1
  moving: boolean
}
export type Farm = FarmSave &
  Worker & {
    plants: Array<{ x: number; y: number; crop: Crop; wait: number }> // wait: seconds until ripe
    shelf: Crop[]
    buyers: Array<{ x: number; y: number; slot: number; look: number; want: number; got: number; owe: number; cool: number; leaving: boolean }>
    helpers: Worker[]
    nextBuyer: number
  }
export const carryCap = (f: Farm) => 4 + 3 * f.level.basket

const worker = (x: number, y: number): Worker => ({ x, y, carry: [], act: 0, face: 1, moving: false })

export function newFarm(save?: Partial<FarmSave> | null): Farm {
  const plot = (crop: Crop, x0: number) => Array.from({ length: 9 }, (_, i) => ({ crop, x: x0 + (i % 3) * 32, y: 62 + Math.floor(i / 3) * 32, wait: 0 }))
  // Spread over the defaults so a save from before a pad existed still loads.
  const level = { wheat: 0, basket: 0, shoes: 0, helper: 0, ...save?.level }
  return {
    coins: save?.coins ?? 0,
    till: save?.till ?? 0,
    sold: save?.sold ?? 0,
    level,
    paid: { wheat: 0, basket: 0, shoes: 0, helper: 0, ...save?.paid },
    ...worker(180, 200),
    plants: [...plot('tomato', 38), ...plot('wheat', 258)],
    shelf: [],
    buyers: [],
    helpers: Array.from({ length: level.helper }, (_, i) => worker(150 + i * 60, 170)),
    nextBuyer: 1,
  }
}

type At = { x: number; y: number }
const dist = (a: At, b: At) => Math.hypot(a.x - b.x, a.y - b.y)
const near = (a: At, b: At, r: number) => dist(a, b) < r

function walk(w: Worker, dx: number, dy: number, speed: number, dt: number) {
  const len = Math.hypot(dx, dy)
  w.moving = len > 0.01
  if (!w.moving) return
  const v = (speed * dt) / Math.max(1, len)
  w.x = Math.min(FARM_W - 14, Math.max(14, w.x + dx * v))
  w.y = Math.min(FARM_H - 14, Math.max(24, w.y + dy * v))
  if (Math.abs(dx) > 0.01) w.face = dx > 0 ? 1 : -1
}

/** A worker's hands: pick a ripe crop within reach, otherwise unload at the stall. */
function work(f: Farm, w: Worker, cap: number, dt: number) {
  w.act -= dt
  if (w.act > 0) return
  const ripe = w.carry.length < cap && f.plants.find((p) => !p.wait && (p.crop === 'tomato' || f.level.wheat) && near(w, p, 30))
  if (ripe) {
    w.carry.push(ripe.crop)
    ripe.wait = GROW_S
    w.act = 0.12
  } else if (w.carry.length && f.shelf.length < SHELF_CAP && near(w, SPOT.stall, 46)) {
    f.shelf.push(w.carry.pop()!)
    w.act = 0.1
  }
}

/** Advances the farm by `dt` seconds, in place. (dx, dy) is the joystick, each from -1 to 1. */
export function stepFarm(f: Farm, dx: number, dy: number, dt: number, rnd: Rnd = Math.random) {
  for (const p of f.plants) p.wait = Math.max(0, p.wait - dt)
  walk(f, dx, dy, 110 + 35 * f.level.shoes, dt)
  work(f, f, carryCap(f), dt)

  // Helpers do the round on their own: to the nearest ripe crop until their arms are full, then to the stall.
  f.helpers.forEach((h, i) => {
    const ripe = f.plants.filter((p) => !p.wait && (p.crop === 'tomato' || f.level.wheat)).sort((a, b) => dist(h, a) - dist(h, b))[0]
    const unload = h.carry.length >= HELPER_CAP || (h.carry.length > 0 && !ripe)
    const to = unload ? { x: SPOT.stall.x + (i ? 34 : -34), y: SPOT.stall.y } : (ripe ?? { x: 150 + i * 60, y: 170 })
    const d = dist(h, to)
    walk(h, d > 4 ? (to.x - h.x) / d : 0, d > 4 ? (to.y - h.y) / d : 0, 85, dt)
    work(f, h, HELPER_CAP, dt)
  })

  if (f.till && near(f, SPOT.till, 34)) {
    const take = Math.min(f.till, Math.ceil(f.till * dt * 8))
    f.till -= take
    f.coins += take
  }

  for (const id of Object.keys(PADS) as FarmPad[]) {
    const cost = PADS[id].costs[f.level[id]]
    if (cost === undefined || !f.coins || !near(f, PADS[id], 26)) continue
    const pay = Math.min(f.coins, cost - f.paid[id], Math.ceil(cost * dt * 1.5))
    f.coins -= pay
    f.paid[id] += pay
    if (f.paid[id] < cost) continue
    f.level[id]++
    f.paid[id] = 0
    if (id === 'helper') f.helpers.push(worker(PADS.helper.x, PADS.helper.y - 34))
  }

  f.nextBuyer -= dt
  const slot = SPOT.queue.findIndex((_, i) => !f.buyers.some((b) => b.slot === i && !b.leaving))
  if (f.nextBuyer <= 0 && slot >= 0) {
    f.buyers.push({ x: SPOT.queue[slot].x, y: FARM_H + 20, slot, look: Math.floor(rnd() * 997), want: 1 + Math.floor(rnd() * 3), got: 0, owe: 0, cool: 0, leaving: false })
    f.nextBuyer = 2 + rnd() * 3
  }
  for (const b of f.buyers) {
    const goal = b.leaving ? FARM_H + 40 : SPOT.queue[b.slot].y
    if (Math.abs(goal - b.y) > 70 * dt) {
      b.y += Math.sign(goal - b.y) * 70 * dt
      continue
    }
    b.y = goal
    b.cool -= dt
    if (b.leaving || b.cool > 0 || !f.shelf.length) continue
    b.owe += CROP_PRICE[f.shelf.shift()!]
    b.cool = 0.35
    if (++b.got >= b.want) {
      // Paid in full: the money lands on the mat and the customer walks off beside the queue.
      f.till += b.owe
      f.sold += b.got
      b.leaving = true
      b.x += 16
    }
  }
  f.buyers = f.buyers.filter((b) => !(b.leaving && b.y >= FARM_H + 40))
}
