import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { test } from 'node:test'

// Runs the real server on a throwaway in-memory database, then reads it the way the growth tools do.
test('growth tools read the live server with the stats key, and only with it', async (t) => {
  const PORT = '8899'
  const TOKEN = 'test-token-0123456789abcdef'
  const server = spawn('npx', ['tsx', 'server/index.ts'], { env: { ...process.env, PORT, DB_PATH: ':memory:', STATS_TOKEN: TOKEN }, stdio: 'pipe' })
  t.after(() => server.kill())
  await new Promise<void>((ok, fail) => {
    server.stdout.on('data', (b) => String(b).includes('OshAds server on') && ok())
    server.on('exit', (code) => fail(new Error(`server exited ${code}`)))
  })
  const base = `http://localhost:${PORT}`

  assert.equal((await fetch(`${base}/api/db`)).status, 401) // no key
  assert.equal((await fetch(`${base}/api/analytics`, { headers: { Authorization: 'Bearer wrong-token-0123456789ab' } })).status, 401)
  const write = await fetch(`${base}/api/docs/apps/x`, { method: 'PUT', headers: { Authorization: `Bearer ${TOKEN}` }, body: '{"id":"x"}' })
  assert.equal(write.status, 401) // the key reads, it never writes

  process.env.OSHADS_API_URL = base
  process.env.OSHADS_API_TOKEN = TOKEN
  const { data, usingSampleData } = await import('./data')
  assert.equal(usingSampleData, false)
  assert.ok((await data.apps()).length > 0)
  assert.ok(Array.isArray(await data.campaigns()))
  assert.equal((await data.daily()).length, 60)
  assert.deepEqual(await data.sources(), []) // a fresh database has no visits yet
})
