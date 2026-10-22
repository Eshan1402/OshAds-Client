import assert from 'node:assert/strict'
import { test } from 'node:test'
import { apps } from '@/data/apps'
import { campaigns } from '@/data/campaigns'
import type { Campaign, MobileApp } from '@/types'
import { recommend } from './recommend'

const live = apps.filter((a) => a.status === 'live')

test('never recommends installed apps, the app just viewed, or apps that are not live', () => {
  const installed = live.slice(0, 3).map((a) => a.id)
  const viewed = [live[3].id]
  const ids = recommend(apps, campaigns, { installed, viewed }, 50).map((r) => r.app.id)
  for (const id of [...installed, ...viewed]) assert.ok(!ids.includes(id), `${id} should be excluded`)
  for (const id of ids) assert.equal(apps.find((a) => a.id === id)?.status, 'live')
})

// Fixtures are built here so the tests don't depend on whatever the live catalogue holds.
const base = live[0]
const day = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10)
const appIn = (id: string, category: MobileApp['category'], tags: string[]): MobileApp => ({ ...base, id, slug: id, category, tags })
const underDelivering = (appId: string) =>
  ({
    appId,
    status: 'active',
    startDate: day(-20),
    endDate: day(10),
    budget: 1_000_000,
    spent: 0,
    downloads: 0,
    targetInstalls: 10_000,
    targeting: { countries: [], platforms: ['ios', 'android'], ageRange: [18, 65], interests: [], devices: ['phone'] },
  }) as unknown as Campaign

test('a paid campaign cannot beat a strongly relevant organic match', () => {
  const organic = appIn('t_organic', 'health', ['x'])
  const sponsored = appIn('t_sponsored', 'gaming', ['y'])
  const [first, second] = recommend([organic, sponsored], [underDelivering('t_sponsored')], { interests: ['health'] }, 2)
  assert.equal(first.app.id, 't_organic')
  assert.equal(second.sponsored, true)
})

test('diversity re-rank spreads the first picks across categories', () => {
  const pool = [
    ...['a', 'b', 'c', 'd'].map((x) => appIn(`loan_${x}`, 'loans', ['small loans'])),
    ...['a', 'b'].map((x) => appIn(`fin_${x}`, 'finance', ['budget'])),
  ]
  const cats = new Set(recommend(pool, [], {}, 4).map((r) => r.app.category))
  assert.ok(cats.size >= 2, `got only ${[...cats].join(', ')}`)
})
