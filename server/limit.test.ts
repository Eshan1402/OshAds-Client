import assert from 'node:assert/strict'
import { test } from 'node:test'
import { limiter } from './limit'

test('limiter allows max requests per key per window, then blocks', () => {
  const hit = limiter(3, 60_000)
  assert.deepEqual([hit('a'), hit('a'), hit('a'), hit('a')], [false, false, false, true])
  assert.equal(hit('b'), false) // keys are independent
  const short = limiter(1, -1) // window already over: every request starts a new one
  assert.deepEqual([short('a'), short('a')], [false, false])
})
