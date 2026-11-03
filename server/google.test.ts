import assert from 'node:assert/strict'
import { test } from 'node:test'

process.env.DB_PATH = ':memory:'
const { checkClaims } = await import('./google')
const auth = await import('./auth')

const now = 1_800_000_000
const good = { iss: 'https://accounts.google.com', aud: 'cid', exp: now + 60, nonce: 'n1', email: 'Shobit@oshads.com', email_verified: true, hd: 'oshads.com', name: 'Shobit' }
const check = (over: Record<string, unknown>) => checkClaims({ ...good, ...over }, 'n1', 'cid', now)

test('only verified Google Workspace accounts on oshads.com get in', () => {
  assert.deepEqual(check({}), { email: 'shobit@oshads.com', name: 'Shobit' })
  assert.deepEqual(check({ hd: undefined }), { error: 'not_staff' }) // personal Gmail has no hd
  assert.deepEqual(check({ email: 'x@gmail.com', hd: 'oshads.com' }), { error: 'not_staff' })
  assert.deepEqual(check({ email: 'x@evil-oshads.com', hd: 'evil-oshads.com' }), { error: 'not_staff' })
  assert.deepEqual(check({ email_verified: false }), { error: 'not_staff' })
  assert.deepEqual(check({ aud: 'someone-elses-app' }), { error: 'bad_token' })
  assert.deepEqual(check({ nonce: 'replayed' }), { error: 'bad_token' })
  assert.deepEqual(check({ exp: now - 1 }), { error: 'bad_token' })
  assert.deepEqual(check({ iss: 'https://evil.example' }), { error: 'bad_token' })
})

test('first Google sign-in creates a read-only analyst; existing staff keep their role and password login stays shut', () => {
  const first = auth.staffUser('new.person@oshads.com', 'New Person')
  assert.equal(first.user.role, 'analyst')
  assert.equal(auth.staffUser('NEW.PERSON@oshads.com', 'x').id, first.id) // same account, any case
  assert.equal(auth.login('new.person@oshads.com', '', false), null) // Google-only accounts have no password
})
