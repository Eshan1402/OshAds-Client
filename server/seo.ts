/**
 * What crawlers get: the built index.html with this URL's own title, description, canonical, social tags,
 * JSON-LD and a plain-HTML version of the page inside #root. React replaces #root on load, so visitors see
 * the normal app; search engines and AI crawlers (which don't run JavaScript) see real, distinct pages.
 */
import { categories, categoryBySlug } from '../src/data/categories'
import { posts } from '../src/data/posts'
import type { MobileApp } from '../src/types'

const SITE = (process.env.SITE_URL ?? 'https://click.oshads.com').replace(/\/$/, '')
const NAME = 'OshAds'
const DEFAULT_DESC = 'OshAds is a free guide to mobile apps: plain-language listings, links to official stores only, and rewards for installing selected apps.'

type Page = { status: number; title: string; description: string; path: string; h1: string; body: string; jsonLd: object[]; noindex?: boolean; image?: string }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const clip = (s: string, n = 158) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)
const link = (href: string, text: string) => `<a href="${esc(href)}">${esc(text)}</a>`
const list = (items: string[]) => (items.length ? `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>` : '')
const appItem = (a: MobileApp) => `${link(`/app/${a.slug}`, a.name)}: ${esc(a.tagline)}`
const crumbs = (trail: Array<[string, string]>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + path })),
})
/** The blog's light markdown (## headings, blank-line paragraphs, - lists) as safe HTML. */
const markdown = (md: string) =>
  md
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      if (block.startsWith('## ')) return `<h2>${esc(block.slice(3))}</h2>`
      if (/^- /m.test(block) && block.split('\n').every((l) => l.startsWith('- '))) return list(block.split('\n').map((l) => esc(l.slice(2))))
      return `<p>${esc(block.replace(/\n/g, ' '))}</p>`
    })
    .join('')

const STATIC: Record<string, Omit<Page, 'path' | 'status' | 'jsonLd' | 'body'> & { body?: (apps: MobileApp[]) => string }> = {
  '/explore': { title: `Explore all apps · ${NAME}`, h1: 'Explore apps', description: 'Browse every app listed on OshAds by category, with plain-language descriptions and links to the official stores.', body: (apps) => list(apps.map(appItem)) },
  '/trending': { title: `Trending apps this week · ${NAME}`, h1: 'Trending apps this week', description: 'The apps OshAds visitors are viewing and installing most this week.', body: (apps) => list([...apps].sort((a, b) => (a.trendingRank ?? 999) - (b.trendingRank ?? 999)).slice(0, 20).map(appItem)) },
  '/categories': { title: `App categories · ${NAME}`, h1: 'App categories', description: 'Find apps by category: small loans, banking, trading, crypto, insurance, shopping, food and more.', body: () => list(categories.map((c) => `${link(`/categories/${c.slug}`, c.name)}: ${esc(c.description)}`)) },
  '/blog': { title: `Guides and tips · ${NAME}`, h1: 'Guides and tips', description: 'Plain-language guides on staying safe with apps, borrowing and money apps, and getting more from your phone.', body: () => list(posts.map((p) => `${link(`/blog/${p.slug}`, p.title)}: ${esc(p.excerpt)}`)) },
  '/about': { title: `About · ${NAME}`, h1: 'About OshAds', description: 'OshAds helps people discover apps worth installing and helps good apps find the people who will love them. Driven by results.' },
  '/rewards': { title: `Rewards · ${NAME}`, h1: 'Earn Osh coins', description: 'Install apps marked with a reward from their official store and earn Osh coins. No account needed.' },
  '/search': { title: `Search apps · ${NAME}`, h1: 'Search apps', description: DEFAULT_DESC, noindex: true },
  '/login': { title: `Sign in · ${NAME}`, h1: 'Sign in', description: DEFAULT_DESC, noindex: true },
}

export function pageFor(rawPath: string, apps: MobileApp[]): Page {
  const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath
  const live = apps.filter((a) => a.status === 'live')
  const base = { status: 200, path, jsonLd: [] as object[], body: '' }
  const notFound: Page = { ...base, status: 404, path, title: `Page not found · ${NAME}`, h1: 'Page not found', description: DEFAULT_DESC, noindex: true, body: `<p>${link('/', 'Go to the OshAds home page')}</p>` }

  if (path === '/') {
    const featured = live.filter((a) => a.promoted).concat(live.filter((a) => !a.promoted)).slice(0, 24)
    return {
      ...base,
      title: `${NAME} — Discover apps worth installing`,
      h1: 'Discover apps worth installing',
      description: DEFAULT_DESC,
      body: `<p>${esc(DEFAULT_DESC)}</p><h2>Categories</h2>${list(categories.map((c) => link(`/categories/${c.slug}`, c.name)))}<h2>Apps</h2>${list(featured.map(appItem))}<h2>Guides</h2>${list(posts.map((p) => link(`/blog/${p.slug}`, p.title)))}`,
      jsonLd: [
        { '@context': 'https://schema.org', '@type': 'Organization', name: NAME, url: SITE, logo: `${SITE}/favicon.svg`, slogan: 'Driven by results' },
        { '@context': 'https://schema.org', '@type': 'WebSite', name: NAME, url: SITE, potentialAction: { '@type': 'SearchAction', target: `${SITE}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' } },
      ],
    }
  }
  if (path.startsWith('/dashboard')) return { ...STATIC['/login'], ...base, title: `Dashboard · ${NAME}`, h1: 'Dashboard', noindex: true }
  if (STATIC[path]) {
    const { body, ...rest } = STATIC[path]
    return { ...base, ...rest, body: `<p>${esc(rest.description)}</p>${body?.(live) ?? ''}` }
  }

  const [, section, slug] = path.split('/')
  if (section === 'categories' && slug) {
    const cat = categoryBySlug[slug as keyof typeof categoryBySlug]
    if (!cat) return notFound
    const inCat = live.filter((a) => a.category === cat.slug)
    return {
      ...base,
      title: `${cat.name} apps · ${NAME}`,
      h1: `${cat.name} apps`,
      description: clip(`${inCat.length} ${cat.name.toLowerCase()} apps on OshAds. ${cat.description}`),
      body: `<p>${esc(cat.description)}</p>${list(inCat.map(appItem))}`,
      jsonLd: [crumbs([['Home', '/'], ['Categories', '/categories'], [cat.name, path]])],
    }
  }
  if (section === 'app' && slug) {
    const app = live.find((a) => a.slug === slug)
    if (!app) return notFound
    const cat = categoryBySlug[app.category]
    const extra = [
      app.benefits.length ? `<h2>Why people use it</h2>${list(app.benefits.map(esc))}` : '',
      app.features.length ? `<h2>Key features</h2>${list(app.features.map((f) => esc(`${f.title}: ${f.description}`)))}` : '',
    ].join('')
    const related = live.filter((a) => a.category === app.category && a.id !== app.id).slice(0, 8)
    return {
      ...base,
      title: `${app.name} — ${cat?.name ?? 'App'} · ${NAME}`,
      h1: app.name,
      description: clip(`${app.name}: ${app.tagline}. ${app.description}`),
      image: app.iconImage && !app.iconImage.startsWith('data:') ? new URL(app.iconImage, SITE).href : undefined,
      body: `<p>${esc(app.tagline)}</p><p>${esc(app.description)}</p>${extra}<p>${link(`/categories/${app.category}`, `More ${cat?.name ?? ''} apps`)}</p>${related.length ? `<h2>Similar apps</h2>${list(related.map(appItem))}` : ''}`,
      jsonLd: [crumbs([['Home', '/'], [cat?.name ?? 'Apps', `/categories/${app.category}`], [app.name, path]])],
    }
  }
  if (section === 'blog' && slug) {
    const post = posts.find((p) => p.slug === slug)
    if (!post) return notFound
    return {
      ...base,
      title: `${post.title} · ${NAME}`,
      h1: post.title,
      description: clip(post.excerpt),
      body: `<p>${esc(post.excerpt)}</p>${markdown(post.body)}`,
      jsonLd: [
        { '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.excerpt, datePublished: post.date, dateModified: post.date, author: { '@type': 'Organization', name: NAME, url: SITE }, publisher: { '@type': 'Organization', name: NAME, logo: { '@type': 'ImageObject', url: `${SITE}/favicon.svg` } }, mainEntityOfPage: SITE + path },
        crumbs([['Home', '/'], ['Guides', '/blog'], [post.title, path]]),
      ],
    }
  }
  return notFound
}

/** Fills the built index.html for one page. JSON-LD escapes "<" so a name containing "</script>" can't break out. */
export function renderPage(indexHtml: string, page: Page) {
  const url = SITE + page.path
  const head = [
    `<link rel="canonical" href="${esc(url)}" />`,
    page.noindex ? '<meta name="robots" content="noindex, follow" />' : '',
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${NAME}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta name="twitter:card" content="summary" />`,
    page.image ? `<meta property="og:image" content="${esc(page.image)}" />` : '',
    ...page.jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`),
  ].filter(Boolean)
  return indexHtml
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(page.description)}" />`)
    .replace('</head>', `    ${head.join('\n    ')}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root"><main><h1>${esc(page.h1)}</h1>${page.body}</main></div>`)
}

/** /llms.txt: a plain map of the site for AI assistants (https://llmstxt.org). */
export function llmsTxt(apps: MobileApp[]) {
  const live = apps.filter((a) => a.status === 'live')
  return [
    `# ${NAME}`,
    '',
    `> ${DEFAULT_DESC}`,
    '',
    '## Categories',
    ...categories.map((c) => `- [${c.name}](${SITE}/categories/${c.slug}): ${c.description}`),
    '',
    '## Guides',
    ...posts.map((p) => `- [${p.title}](${SITE}/blog/${p.slug}): ${p.excerpt}`),
    '',
    '## Apps',
    ...live.map((a) => `- [${a.name}](${SITE}/app/${a.slug}): ${a.tagline}`),
    '',
  ].join('\n')
}

/** sitemap.xml from the live catalogue, so apps added in the dashboard reach search engines without a rebuild. */
export function sitemapXml(apps: MobileApp[], today = new Date().toISOString().slice(0, 10)) {
  const urls = [
    ...['/', '/explore', '/trending', '/categories', '/blog', '/about', '/rewards'].map((p) => [p, today]),
    ...categories.map((c) => [`/categories/${c.slug}`, today]),
    ...posts.map((p) => [`/blog/${p.slug}`, p.date]),
    ...apps.filter((a) => a.status === 'live').map((a) => [`/app/${a.slug}`, a.updatedAt.slice(0, 10)]),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([loc, mod]) => `  <url><loc>${esc(SITE + loc)}</loc><lastmod>${mod}</lastmod></url>`).join('\n')}\n</urlset>\n`
}
