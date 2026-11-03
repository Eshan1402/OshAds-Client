import assert from 'node:assert/strict'
import { test } from 'node:test'

process.env.DB_PATH = ':memory:'
process.env.SEED_PASSWORD = 'correct-horse-battery'
const auth = await import('./auth')

test('passwords are hashed, verified, and never stored as typed', () => {
  const hash = auth.hashPassword('s3cret-pass')
  assert.ok(!hash.includes('s3cret-pass'))
  assert.equal(auth.verifyPassword('s3cret-pass', hash), true)
  assert.equal(auth.verifyPassword('wrong-pass', hash), false)
  assert.equal(auth.verifyPassword('s3cret-pass', 'garbage'), false)
})

test('login succeeds only with the right password, and issues a session the server recognises', () => {
  auth.seedUsers()
  assert.equal(auth.login('shobit@oshads.com', 'nope-nope-nope', false), null)
  assert.equal(auth.login('nobody@oshads.com', 'correct-horse-battery', false), null)
  const s = auth.login('SHOBIT@oshads.com', 'correct-horse-battery', true)
  assert.ok(s)
  const req = { headers: { cookie: `theme=dark; sid=${s.token}` } } as never
  assert.equal(auth.currentSession(req)?.user.email, 'shobit@oshads.com')
  auth.logout(req)
  assert.equal(auth.currentSession(req), null)
})

test('roles gate writes', () => {
  const analyst = { id: 'u', name: '', email: '', role: 'analyst', title: '', avatarColor: '' } as const
  assert.equal(auth.can(analyst, 'analytics:read'), true)
  assert.equal(auth.can(analyst, 'campaigns:write'), false)
  assert.equal(auth.can(null, 'analytics:read'), false)
})

test('login attempts are throttled per IP', () => {
  for (let i = 0; i < 10; i++) assert.equal(auth.throttled('203.0.113.9'), false)
  assert.equal(auth.throttled('203.0.113.9'), true)
  assert.equal(auth.throttled('203.0.113.10'), false)
})
