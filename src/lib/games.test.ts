import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canPour, cluster, dealTubes, fit, floating, lineCells, placeBlock, placeWords, pour, SHAPES, sortedTubes, stepSnake, TUBE } from './games'

test('word search hides every word readably along a straight line, and only straight drags select', () => {
  const { grid, placed } = placeWords(['APPLE', 'MANGO', 'PEAR', 'KIWI', 'LEMON', 'GRAPE'], 10)
  assert.equal(grid.length, 100)
  assert.ok(grid.every((ch) => /^[A-Z]$/.test(ch)))
  assert.ok(placed.length >= 5) // a 10×10 grid fits these easily
  for (const p of placed) {
    assert.equal(p.cells.map((c) => grid[c]).join(''), p.word)
    assert.deepEqual(lineCells(p.cells[0], p.cells.at(-1)!, 10), p.cells)
  }
  assert.deepEqual(lineCells(0, 33, 10), [0, 11, 22, 33]) // diagonal
  assert.deepEqual(lineCells(9, 6, 10), [9, 8, 7, 6]) // backwards along a row
  assert.equal(lineCells(0, 12, 10), null) // knight-shaped: not a line
})

test('snake grows on food, dies on walls and itself, and may follow its own tail', () => {
  assert.deepEqual(stepSnake([5, 4], 'right', 10, 6), { snake: [6, 5, 4], ate: true, dead: false })
  assert.equal(stepSnake([9], 'right', 10, 0).dead, true) // right wall
  assert.equal(stepSnake([11, 12, 2, 1, 0, 10], 'left', 10, 99).dead, false) // into the cell the tail (10) is leaving
  assert.equal(stepSnake([11, 12, 2, 1, 10, 20], 'left', 10, 99).dead, true) // 10 is body, not the tail
})

test('color sort pours the whole top run that fits, onto a match or an empty tube only', () => {
  const tubes = dealTubes(5)
  assert.equal(tubes.length, 7)
  assert.equal(tubes.flat().length, 5 * TUBE)
  assert.deepEqual(pour([[1, 2, 2], [3], []], 0, 2), [[1], [3], [2, 2]])
  assert.equal(pour([[1, 2, 2], [3], []], 0, 1), null) // colour mismatch
  assert.deepEqual(pour([[2, 2, 2], [1, 1, 2], []], 0, 1), [[2, 2], [1, 1, 2, 2], []]) // only one fits
  assert.equal(sortedTubes([[1, 1, 1, 1], [], [2, 2, 2, 2]]), true)
  assert.equal(sortedTubes([[1, 1, 1], [1], []]), false)
  assert.equal(canPour([[1, 2, 1, 2], [2, 1, 2, 1]]), false)
})

test('block puzzle rejects overlaps and edges, and clears full rows and columns together', () => {
  const empty = Array(64).fill(0)
  assert.equal(fit(empty, SHAPES[5], 5), null) // 4-wide bar from column 5 runs off the edge
  assert.deepEqual(fit(empty, SHAPES[7], 0), [0, 1, 8, 9])
  const nearly = empty.map((_, i) => (i < 7 || (i % 8 === 7 && i > 7) ? 1 : 0)) // row 0 and column 7, each missing cell 7
  const { board, lines } = placeBlock(nearly, [7], 2)
  assert.equal(lines, 2)
  assert.ok(board.every((v) => v === 0))
})

test('bubbles pop as same-colour clusters and unattached bubbles fall', () => {
  const grid = [[0, 0, 1], [0, 2], [-1, 2, -1]]
  assert.equal(cluster(grid, 0, 0, true).length, 3) // (0,0) (0,1) (1,0)
  assert.deepEqual(floating([[-1, -1, 1], [-1, 2], [-1, 2, -1]]), []) // still hangs from (0,2)
  assert.deepEqual(floating([[-1, -1, 1], [2, -1], [2, -1, -1]]).sort(), [[1, 0], [2, 0]])
})
