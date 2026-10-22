// UI quality audit: screenshots + accessibility + runtime health across routes, viewports and themes.
// Usage: npm run dev  (in another terminal), then  npm run audit  [-- --only=/explore]
import AxeBuilder from '@axe-core/playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const BASE = process.env.AUDIT_URL ?? 'http://localhost:5173'
const OUT = 'audit'
const only = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]

const publicRoutes = ['/', '/explore', '/trending', '/categories', '/categories/finance', '/app/ledgerly', '/search?q=ai', '/about', '/login']
const dashRoutes = ['/dashboard', '/dashboard/campaigns', '/dashboard/campaigns/CMP-1047', '/dashboard/campaigns/new', '/dashboard/apps', '/dashboard/apps/new', '/dashboard/clients', '/dashboard/clients/cl_northwind', '/dashboard/analytics', '/dashboard/traffic', '/dashboard/reports', '/dashboard/notifications', '/dashboard/settings']
const viewports = { mobile: { width: 375, height: 812 }, tablet: { width: 768, height: 1024 }, desktop: { width: 1440, height: 900 } }
const themes = ['light', 'dark']

const slug = (r) => (r === '/' ? 'home' : r.replace(/^\//, '').replace(/[/?=]/g, '_'))

async function login(page) {
  // Demo credentials from the project's seed data (src/data/users.ts) — local dev only.
  const { DEMO_EMAIL, DEMO_PASS } = { DEMO_EMAIL: 'priya@oshads.com', DEMO_PASS: 'adwin-demo-2026' }
  await page.goto(`${BASE}/login`)
  await page.locator('input[type=email]').fill(DEMO_EMAIL)
  await page.locator('input[autocomplete=current-password]').fill(DEMO_PASS)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/dashboard', { timeout: 15000 })
}

async function auditPage(page, route, vpName, theme) {
  const consoleErrors = []
  const failed = []
  const onConsole = (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 240))
  const onPageError = (e) => consoleErrors.push(`pageerror: ${e.message.slice(0, 240)}`)
  const onFailed = (r) => !r.url().includes('fonts.g') && failed.push(r.url())
  page.on('console', onConsole)
  page.on('pageerror', onPageError)
  page.on('requestfailed', onFailed)

  await page.goto(BASE + route, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)

  const metrics = await page.evaluate((isMobile) => {
    // User-facing check: can the page actually be scrolled sideways?
    const y0 = window.scrollY
    window.scrollTo(10000, y0)
    const overflowX = Math.round(window.scrollX)
    window.scrollTo(0, y0)
    const imgsNoAlt = [...document.images].filter((i) => !i.hasAttribute('alt')).length
    const small = []
    if (isMobile) {
      for (const el of document.querySelectorAll('a[href],button,[role=button],[role=tab],input,select')) {
        const r = el.getBoundingClientRect()
        const style = getComputedStyle(el)
        if (!r.width || !r.height || style.visibility === 'hidden' || el.closest('[aria-hidden=true]') || (r.width <= 1 && r.height <= 1)) continue
        const inlineText = el.tagName === 'A' && style.display === 'inline'
        if (!inlineText && (r.width < 40 || r.height < 40)) small.push(`${el.tagName.toLowerCase()}${el.getAttribute('aria-label') ? `[${el.getAttribute('aria-label')}]` : ''} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || '').trim().slice(0, 24)}"`)
      }
    }
    return { overflowX, imgsNoAlt, smallTargets: small.slice(0, 12), smallTargetCount: small.length, h1: document.querySelectorAll('h1').length }
  }, vpName === 'mobile')

  // [data-decorative]: miniature mock app screens (aria-hidden pictures of UI, not readable text).
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).exclude('[data-decorative]').analyze()
  const violations = axe.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.length,
    sample: v.nodes.slice(0, 3).map((n) => n.target.join(' ') + (n.failureSummary ? ` — ${n.failureSummary.split('\n')[1]?.trim() ?? ''}` : '')),
  }))

  const file = `${OUT}/screens/${vpName}-${theme}-${slug(route)}.png`
  await page.screenshot({ path: file, fullPage: true })

  page.off('console', onConsole)
  page.off('pageerror', onPageError)
  page.off('requestfailed', onFailed)
  return { route, viewport: vpName, theme, ...metrics, consoleErrors, failed: failed.slice(0, 5), violations, screenshot: file }
}

const browser = await chromium.launch({ channel: 'chrome' })
await mkdir(`${OUT}/screens`, { recursive: true })
const results = []

for (const [vpName, viewport] of Object.entries(viewports)) {
  for (const theme of themes) {
    const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce', deviceScaleFactor: 1 })
    await ctx.addInitScript((t) => localStorage.setItem('adwin:theme', t), theme)
    const page = await ctx.newPage()
    for (const r of publicRoutes.filter((r) => !only || r === only)) results.push(await auditPage(page, r, vpName, theme))
    if (!only || only.startsWith('/dashboard')) {
      await login(page)
      for (const r of dashRoutes.filter((r) => !only || r === only)) results.push(await auditPage(page, r, vpName, theme))
    }
    await ctx.close()
    process.stdout.write(`✓ ${vpName}/${theme}\n`)
  }
}
await browser.close()

await writeFile(`${OUT}/report.json`, JSON.stringify(results, null, 2))

// Summary: unique axe rules across the run, plus runtime problems.
const rules = new Map()
for (const r of results) for (const v of r.violations) {
  const k = v.id
  const e = rules.get(k) ?? { ...v, pages: new Set(), nodes: 0 }
  e.pages.add(`${r.viewport}/${r.theme}${r.route}`)
  e.nodes += v.nodes
  rules.set(k, e)
}
console.log('\n=== Accessibility (axe, WCAG 2.1 AA) ===')
for (const [id, e] of rules) console.log(`- [${e.impact}] ${id}: ${e.help} — ${e.nodes} nodes on ${e.pages.size} page-variants\n    e.g. ${e.sample[0]}`)
if (!rules.size) console.log('none')
console.log('\n=== Runtime / layout ===')
for (const r of results) {
  const issues = []
  if (r.overflowX > 1) issues.push(`horizontal overflow ${r.overflowX}px`)
  if (r.consoleErrors.length) issues.push(`console: ${r.consoleErrors[0]}`)
  if (r.failed.length) issues.push(`failed requests: ${r.failed.join(', ')}`)
  if (r.imgsNoAlt) issues.push(`${r.imgsNoAlt} img without alt`)
  if (r.h1 !== 1) issues.push(`${r.h1} <h1> elements`)
  if (r.smallTargetCount) issues.push(`${r.smallTargetCount} touch targets <40px: ${r.smallTargets.slice(0, 3).join(' | ')}`)
  if (issues.length) console.log(`- ${r.viewport}/${r.theme} ${r.route}: ${issues.join(' · ')}`)
}
console.log(`\n${results.length} page-variants audited · screenshots in ${OUT}/screens · full report ${OUT}/report.json`)
