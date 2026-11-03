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
