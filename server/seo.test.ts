import assert from 'node:assert/strict'
import { test } from 'node:test'
import { apps } from '../src/data/apps'
import { posts } from '../src/data/posts'
import { llmsTxt, pageFor, renderPage } from './seo'

const shell = '<html><head><title>x</title><meta name="description" content="x" /></head><body><div id="root"></div></body></html>'
const app = apps[0]

test('each page gets its own status, title, heading and canonical', () => {
  const a = pageFor(`/app/${app.slug}`, apps)
  assert.equal(a.status, 200)
  assert.equal(a.h1, app.name)
  const html = renderPage(shell, a)
  assert.match(html, new RegExp(`<link rel="canonical" href="https://[^"]+/app/${app.slug}"`))
  assert.match(html, /<div id="root"><main><h1>/)
  assert.notEqual(pageFor('/', apps).title, a.title)

  const post = pageFor(`/blog/${posts[0].slug}/`, apps) // trailing slash still matches
  assert.equal(post.status, 200)
  assert.match(renderPage(shell, post), /"@type":"Article"/)
})

test('unknown pages, apps and categories are real 404s, and private pages are noindex', () => {
  for (const p of ['/nope', '/app/not-an-app', '/categories/not-a-category', '/blog/missing']) assert.equal(pageFor(p, apps).status, 404, p)
  assert.equal(pageFor(`/app/${app.slug}`, [{ ...app, status: 'paused' }]).status, 404) // unlisted apps aren't served
  assert.match(renderPage(shell, pageFor('/dashboard/campaigns', apps)), /noindex/)
  assert.match(renderPage(shell, pageFor('/login', apps)), /noindex/)
})

test('names from the dashboard cannot inject HTML or break out of JSON-LD', () => {
  const evil = { ...app, name: '</script><script>alert(1)</script>', tagline: '<img src=x onerror=alert(1)>' }
  const html = renderPage(shell, pageFor(`/app/${app.slug}`, [evil]))
  assert.ok(!html.includes('<script>alert(1)'), 'raw script tag leaked')
  assert.ok(!html.includes('<img src=x'), 'raw img tag leaked')
  assert.ok(!/<\/script><script>/.test(html.replace(/<script type="application\/ld\+json">[^<]*<\/script>/g, '')), 'JSON-LD broke out')
})

test('llms.txt lists categories, guides and live apps', () => {
  const txt = llmsTxt(apps)
  assert.match(txt, /^# OshAds/)
  assert.ok(txt.includes(`/app/${app.slug}`))
  assert.ok(txt.includes(`/blog/${posts[0].slug}`))
})
