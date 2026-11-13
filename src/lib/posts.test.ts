import assert from 'node:assert/strict'
import { test } from 'node:test'
import { postCategories, posts } from '../data/posts'

test('blog posts have unique slugs, known categories, and internal links that resolve', () => {
  assert.equal(new Set(posts.map((p) => p.slug)).size, posts.length)
  const cats = postCategories.map((c) => c.slug)
  for (const p of posts) {
    assert.ok(cats.includes(p.category), p.slug)
    assert.ok(p.title.length && p.excerpt.length <= 155, p.slug)
    for (const [, to] of p.body.matchAll(/\]\(\/blog\/([^)]+)\)/g)) assert.ok(posts.some((x) => x.slug === to), `${p.slug} links to missing ${to}`)
  }
})
