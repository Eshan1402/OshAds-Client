import assert from 'node:assert/strict'
import { test } from 'node:test'
import { apps } from '../src/data/apps'
import { posts } from '../src/data/posts'
import { categoryGuides } from '../src/data/categoryGuides'
import { llmsTxt, pageFor, renderPage, sitemapXml } from './seo'

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

test('sitemap comes from the live catalogue: new apps appear, hidden ones do not', () => {
  const added = { ...app, id: 'app_new', slug: 'brand-new-app', updatedAt: '2026-11-27' }
  const xml = sitemapXml([...apps, added, { ...app, id: 'app_off', slug: 'hidden-app', status: 'paused' }])
  assert.match(xml, /\/app\/brand-new-app<\/loc><lastmod>2026-11-27</)
  assert.ok(!xml.includes('hidden-app'))
  assert.match(xml, /\/blog\//)
})

test('app pages use a hosted logo as the link-preview image, never an inline data URL', () => {
  const hosted = renderPage(shell, pageFor(`/app/${app.slug}`, [{ ...app, iconImage: '/logos/x.png' }]))
  assert.match(hosted, /og:image" content="https:\/\/[^"]+\/logos\/x\.png"/)
  const inline = renderPage(shell, pageFor(`/app/${app.slug}`, [{ ...app, iconImage: 'data:image/png;base64,AAAA' }]))
  assert.ok(!inline.includes('data:image'), 'inline image leaked into og:image')
  assert.match(inline, /og:image" content="https:\/\/[^"]+\/og-image\.png"/) // falls back to the site image
})

test('pages without their own image get the 1200x630 site image; 404s have no canonical', () => {
  const home = renderPage(shell, pageFor('/', apps))
  assert.match(home, /og:image" content="https:\/\/[^"]+\/og-image\.png"/)
  assert.match(home, /twitter:card" content="summary_large_image"/)
  assert.ok(!renderPage(shell, pageFor('/nope', apps)).includes('rel="canonical"'))
  assert.ok(pageFor('/about', apps).body.length > 400, 'about page has real text for crawlers')
})

test('every link inside a blog post points to a page that exists, and crawlers get it as a real link', () => {
  for (const p of [...posts, ...Object.entries(categoryGuides).map(([slug, body]) => ({ slug: `guide:${slug}`, body: body! }))]) {
    for (const [, href] of p.body.matchAll(/\]\((\/[^)\s]*)\)/g)) {
      const path = href.split('#')[0] || '/'
      assert.equal(pageFor(path, apps).status, 200, `${p.slug} links to missing page ${href}`)
    }
  }
  const linked = posts.find((p) => p.body.includes('](/'))!
  assert.match(renderPage(shell, pageFor(`/blog/${linked.slug}`, apps)), /<a href="\/[^"]*">/)
})
