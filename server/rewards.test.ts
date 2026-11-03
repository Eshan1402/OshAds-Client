import assert from 'node:assert/strict'
import { test } from 'node:test'

process.env.DB_PATH = ':memory:'
const { sql } = await import('./db')
const rewards = await import('./rewards')
const analytics = await import('./analytics')
const { recordEvent } = await import('./events')

const visit = { visitor: 'v1', device: 'mobile' as const, os: 'Android', country: 'IN' }
const wallet = '11111111-2222-4333-8444-555555555555'
const today = new Date().toISOString().slice(0, 10)

test('a wallet earns 20 coins per app, only after the install is confirmed', () => {
  const first = rewards.recordClick('app_a', visit, wallet, 'direct')
  assert.equal(first.reward, 'pending')
  assert.deepEqual([rewards.wallet(wallet).balance, rewards.wallet(wallet).pending], [0, 20])

  const second = rewards.recordClick('app_a', visit, wallet, 'direct') // clicking again doesn't double the reward
  assert.equal(rewards.wallet(wallet).pending, 20)

  assert.equal(rewards.confirmConversion(first.clickId, 'install', 1.5, 'postback'), true) // older click: already superseded
  assert.equal(rewards.wallet(wallet).balance, 0)
  assert.equal(rewards.confirmConversion(second.clickId, 'install', 1.5, 'postback'), true)
  assert.deepEqual([rewards.wallet(wallet).balance, rewards.wallet(wallet).pending], [20, 0])

  rewards.confirmConversion(second.clickId, 'install', 1.5, 'postback') // duplicate postback
  assert.equal(rewards.wallet(wallet).balance, 20)
  assert.equal(rewards.recordClick('app_a', visit, wallet, 'direct').reward, 'confirmed')
  assert.equal(rewards.confirmConversion('no-such-click', 'install', 0, 'postback'), false)
})

test('bots get a link but no click, no coins and no counts', () => {
  const { reward } = rewards.recordClick('app_b', null, wallet, 'direct')
  assert.equal(reward, null)
  assert.equal(Number(sql.prepare("SELECT COUNT(*) AS n FROM clicks WHERE app_id = 'app_b'").get()?.n), 0)
})

test('rejected rewards pay nothing', () => {
  const w2 = '99999999-2222-4333-8444-555555555555'
  rewards.recordClick('app_c', visit, w2, 'direct')
  const id = Number((rewards.rewardsForReview('pending') as Array<{ id: number; walletId: string }>).find((r) => r.walletId === w2)!.id)
  assert.equal(rewards.rejectReward(id), true)
  assert.deepEqual([rewards.wallet(w2).balance, rewards.wallet(w2).pending], [0, 0])
})

test('dashboard series counts visitors, sessions, clicks and confirmed downloads from real rows', () => {
  sql.exec('DELETE FROM events; DELETE FROM clicks; DELETE FROM conversions;')
  const t0 = Date.parse(`${today}T00:30:00Z`)
  const ins = sql.prepare("INSERT INTO events (ts, day, visitor, type, app_id, path, source, device, os, country) VALUES (?, ?, ?, ?, ?, '/', 'direct', 'mobile', 'Android', 'IN')")
  ins.run(t0, today, 'v1', 'page_view', null)
  ins.run(t0 + 10 * 60_000, today, 'v1', 'impression', 'app_a')
  ins.run(t0 + 50 * 60_000, today, 'v1', 'page_view', null) // >30 min gap: second session
  ins.run(Date.now() - 60_000, today, 'v2', 'page_view', null) // a minute before v2's click: one session
  const { clickId } = rewards.recordClick('app_a', { ...visit, visitor: 'v2' }, null, 'direct')
  rewards.confirmConversion(clickId, 'install', 2, 'postback')

  const [p] = analytics.series({ from: today, to: today }, null)
  assert.deepEqual(
    { visitors: p.visitors, sessions: p.sessions, impressions: p.impressions, clicks: p.clicks, downloads: p.downloads, revenue: p.revenue },
    { visitors: 2, sessions: 3, impressions: 1, clicks: 1, downloads: 1, revenue: 2 },
  )
  const [scoped] = analytics.series({ from: today, to: today }, ['app_a'])
  assert.equal(scoped.visitors, 2) // v1 saw the card, v2 clicked it
  assert.equal(scoped.clicks, 1)
})

test('campaign spend follows its payout model and never exceeds budget', () => {
  const base = { appId: 'app_a', startDate: today, endDate: today, bid: 3, budget: 100 }
  assert.equal(analytics.campaignStats({ ...base, payoutModel: 'CPI' } as never).spent, 3) // 1 install × 3
  assert.equal(analytics.campaignStats({ ...base, payoutModel: 'CPC' } as never).spent, 3) // 1 click × 3
  assert.equal(analytics.campaignStats({ ...base, payoutModel: 'CPI', budget: 1 } as never).spent, 1)
})

test('impression batches are stored one row per app and malformed events are refused', () => {
  sql.exec('DELETE FROM events;')
  assert.equal(recordEvent(JSON.stringify({ type: 'impression', appIds: ['app_a', 'app_b'] }), visit), true)
  assert.equal(recordEvent('{"type":"hack"}', visit), false)
  assert.equal(recordEvent(JSON.stringify({ type: 'impression', appIds: Array(61).fill('x') }), visit), false)
  assert.equal(Number(sql.prepare("SELECT COUNT(*) AS n FROM events WHERE type = 'impression'").get()?.n), 2)
})

test('a consent cookie keeps the visitor id across days; without it the id is daily', async () => {
  const { visitOf } = await import('./events')
  const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile'
  const a = visitOf('1.2.3.4', ua, null, 'cookie-abcdefghijklmnop')
  const b = visitOf('9.9.9.9', ua, null, 'cookie-abcdefghijklmnop') // new IP, same cookie
  assert.equal(a!.visitor, b!.visitor)
  assert.ok(a!.visitor.startsWith('c'))
  assert.ok(!visitOf('1.2.3.4', ua, null)!.visitor.startsWith('c'))
  assert.equal(visitOf('1.2.3.4', 'Googlebot/2.1', null, 'cookie-abcdefghijklmnop'), null) // bots still ignored
})

test('engagement: returning visitors, time, scroll and what people used', () => {
  sql.exec('DELETE FROM events;')
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
  const ins = sql.prepare("INSERT INTO events (ts, day, visitor, type, app_id, path, source, label, value) VALUES (?, ?, ?, ?, NULL, '/', 'direct', ?, ?)")
  const now = Date.now()
  ins.run(now - 86_400_000, yesterday, 'cAAA', 'page_view', null, null) // came back today
  ins.run(now, today, 'cAAA', 'page_view', null, null)
  ins.run(now, today, 'cBBB', 'page_view', null, null) // first visit
  ins.run(now, today, 'daily1', 'page_view', null, null) // declined cookies: not in the returning maths
  ins.run(now, today, 'cAAA', 'page_time', null, 30)
  ins.run(now, today, 'cBBB', 'page_time', null, 90)
  ins.run(now, today, 'cAAA', 'scroll', null, 40)
  ins.run(now, today, 'cBBB', 'scroll', null, 80)
  ins.run(now, today, 'cAAA', 'game_start', 'snake', null)
  ins.run(now, today, 'cBBB', 'game_start', 'snake', null)
  ins.run(now, today, 'cBBB', 'search', 'loan', null)
  const e = analytics.engagement({ from: today, to: today })
  assert.deepEqual([e.consented, e.returning, e.avgSeconds, e.avgScroll], [2, 1, 60, 60])
  assert.deepEqual(e.games, [{ label: 'snake', count: 2 }])
  assert.deepEqual(e.searches, [{ label: 'loan', count: 1 }])
})

test('engagement events keep only a short label and a sane number', () => {
  sql.exec('DELETE FROM events;')
  recordEvent(JSON.stringify({ type: 'search', label: '  ' + 'X'.repeat(200) }), visit)
  recordEvent(JSON.stringify({ type: 'page_time', value: 1e12 }), visit)
  recordEvent(JSON.stringify({ type: 'scroll', value: 'lots' }), visit)
  const rows = sql.prepare('SELECT type, label, value FROM events ORDER BY rowid').all() as Array<{ type: string; label: string | null; value: number | null }>
  assert.equal(rows[0].label!.length, 60)
  assert.equal(rows[1].value, 86_400) // capped at a day
  assert.equal(rows[2].value, null)
})
