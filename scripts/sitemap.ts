/** Writes public/sitemap.xml and public/robots.txt from the app catalogue. Runs before `vite build`. */
import { writeFileSync } from 'node:fs'
import { apps } from '../src/data/apps'
import { categories } from '../src/data/categories'

// shortcut: reads the seed catalogue; once the API is live, fetch live apps from it instead.
const SITE = (process.env.SITE_URL ?? 'https://oshads.com').replace(/\/$/, '')
const today = new Date().toISOString().slice(0, 10)

const urls = [
  ...['/', '/explore', '/trending', '/categories', '/about'].map((p) => ({ loc: p, lastmod: today })),
  ...categories.map((c) => ({ loc: `/categories/${c.slug}`, lastmod: today })),
  ...apps.filter((a) => a.status === 'live').map((a) => ({ loc: `/app/${a.slug}`, lastmod: a.updatedAt.slice(0, 10) })),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n')}
</urlset>
`
writeFileSync('public/sitemap.xml', xml)
writeFileSync('public/robots.txt', `User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /login\n\nSitemap: ${SITE}/sitemap.xml\n`)
console.log(`sitemap: ${urls.length} URLs for ${SITE}`)
