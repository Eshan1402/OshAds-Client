import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { openCookieSettings } from './CookieConsent'
import { useStaggerReveal } from '@/hooks/useStaggerReveal'
import { categories } from '@/data/categories'
import { Logo } from '@/components/ui/Logo'

export function PublicFooter() {
  const cols = useRef<HTMLDivElement>(null)
  useStaggerReveal(cols)
  return (
    <footer className="border-t border-line bg-surface/40 backdrop-blur-xl">
      <div ref={cols} className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div data-reveal>
          <Logo tagline />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Driven by results. OshAds helps people discover apps worth installing — and helps great apps find the people who will love them.
          </p>
          <p className="mt-6 text-xs text-subtle">
            Some listings are sponsored campaigns. Every app is reviewed before it’s featured, and ratings shown are from the public app stores.
          </p>
        </div>
        <FooterCol title="Discover" links={[['/explore', 'Explore apps'], ['/trending', 'Trending now'], ['/categories', 'All categories'], ['/blog', 'Blog'], ['/search', 'Search']]} />
        <FooterCol title="Categories" links={categories.slice(0, 5).map((c) => [`/categories/${c.slug}`, c.name])} />
        <FooterCol title="Company" links={[['/about', 'About OshAds'], ['/about#advertisers', 'For app publishers'], ['/about#trust', 'How we review apps'], ['/login', 'Manager login']]} />
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Oshads Media LLC · 16192 Coastal Highway, Lewes, Delaware 19958, USA</p>
          <p className="flex gap-4">
            <Link to="/about#privacy" className="inline-flex min-h-10 items-center hover:text-fg sm:min-h-0">Privacy</Link>
            <Link to="/about#terms" className="inline-flex min-h-10 items-center hover:text-fg sm:min-h-0">Terms</Link>
            <button type="button" onClick={openCookieSettings} className="inline-flex min-h-10 items-center hover:text-fg sm:min-h-0">Cookie settings</button>
            <Link to="/about#trust" className="inline-flex min-h-10 items-center hover:text-fg sm:min-h-0">Advertising disclosure</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: string[][] }) {
  return (
    <div data-reveal>
      <h3 className="eyebrow">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map(([to, label]) => (
          <li key={to}>
            <Link to={to} className="inline-flex min-h-10 items-center text-sm text-muted transition-colors hover:text-fg sm:min-h-0">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
