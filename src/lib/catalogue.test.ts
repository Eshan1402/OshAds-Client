import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { test } from 'node:test'
import { apps } from '@/data/apps'
import { brands } from '@/data/brands'
import { clients } from '@/data/clients'

test('catalogue is exactly the client list, with their supplied links and no invented numbers', () => {
  assert.equal(apps.length, brands.length)
  assert.equal(new Set(apps.map((a) => a.id)).size, apps.length, 'ids are unique')
  for (const [i, a] of apps.entries()) {
    const b = brands[i]
    assert.equal(a.category, b.category)
    assert.equal(a.reward, '20 Osh coins')
    assert.equal(a.name, b.name)
    assert.equal(a.website, b.website)
    assert.equal(a.linkedinUrl, b.linkedin)
    assert.equal(a.rating + a.ratingCount + a.downloads, 0, `${a.name} has no made-up stats`)
    assert.ok(clients.some((c) => c.id === a.clientId), `${a.name} has a client`)
    new URL(a.website!) // every website parses
    if (a.iconImage) assert.ok(existsSync(`public${a.iconImage}`), `${a.name} logo file exists`)
  }
})
