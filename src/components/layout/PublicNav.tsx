import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, LayoutDashboard, LogOut, Menu as MenuIcon, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/utils/cn'
import { AccountMenu, requestSignOut } from '@/components/auth/SignOut'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { Kbd } from '@/components/ui/Misc'
import { useFocusTrap } from '@/components/ui/Modal'
import { searchStore } from '@/components/search/searchStore'
import { ThemeToggle } from './ThemeToggle'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/explore', label: 'Explore' },
  { to: '/trending', label: 'Trending' },
  { to: '/categories', label: 'Categories' },
  { to: '/rewards', label: 'Rewards' },
  { to: '/about', label: 'About' },
]

export function PublicNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const sheet = useRef<HTMLDivElement>(null)
  useFocusTrap(mobileOpen, sheet, () => setMobileOpen(false))

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMobileOpen(false), [location.pathname])

  return (
    <header className="sticky top-0 z-40 px-2 pt-2 sm:px-4 sm:pt-3">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-semibold">
        Skip to content
      </a>
      {/* Transparent over the hero; becomes a floating, glossy glass pill once the page scrolls. */}
      <nav
        aria-label="Main"
        className={cn(
          'relative mx-auto flex h-14 items-center gap-6 rounded-2xl px-3 transition-[max-width,background-color,box-shadow,border-color,backdrop-filter] duration-500 ease-[var(--ease-out-expo)] sm:px-5',
          scrolled ? 'glass-strong max-w-[1200px]' : 'max-w-[1280px] border border-transparent',
        )}
      >
        {scrolled && (
          // Specular streak along the top edge — the "gloss".
          <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/25" aria-hidden />
        )}
        <Link to="/" aria-label="OshAds home" className="flex min-h-11 shrink-0 items-center">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn('relative isolate block rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors', isActive ? 'text-fg' : 'text-muted hover:text-fg')
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    {isActive && (
                      <motion.span layoutId="nav-active" className="glass absolute inset-0 -z-10 rounded-full !shadow-none" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={searchStore.open}
            className="glass group hidden h-9 w-56 items-center gap-2 rounded-full px-3.5 text-sm text-subtle transition hover:text-muted xl:flex"
            aria-label="Search apps"
          >
            <Search className="size-4" aria-hidden />
            Search apps…
            <span className="ml-auto flex gap-0.5"><Kbd>⌘</Kbd><Kbd>K</Kbd></span>
          </button>
          <button onClick={searchStore.open} className="grid size-11 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg sm:size-10 xl:hidden" aria-label="Search apps">
            <Search className="size-[18px]" />
          </button>
          <ThemeToggle />
          <div className="hidden sm:block">
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <ButtonLink to="/dashboard" size="sm" variant="secondary" className="rounded-full" leftIcon={<LayoutDashboard className="size-3.5" />}>
                  Dashboard
                </ButtonLink>
                <AccountMenu variant="public" />
              </div>
            ) : (
              <ButtonLink to="/login" size="sm" variant="secondary" className="rounded-full px-4">
                Manager login
              </ButtonLink>
            )}
          </div>
          <button onClick={() => setMobileOpen(true)} className="grid size-11 place-items-center rounded-full text-fg transition hover:bg-surface-2 sm:size-10 lg:hidden" aria-label="Open menu" aria-expanded={mobileOpen}>
            <MenuIcon className="size-5" />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            ref={sheet}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-50 flex flex-col bg-bg/70 backdrop-blur-2xl backdrop-saturate-150 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="container-page flex h-16 items-center justify-between">
              <Logo />
              <button onClick={() => setMobileOpen(false)} className="grid size-10 place-items-center rounded-[10px] text-fg hover:bg-surface-2" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <div className="container-page mt-2">
              <button
                onClick={() => {
                  setMobileOpen(false)
                  searchStore.open()
                }}
                className="flex h-12 w-full items-center gap-3 rounded-xl glass px-4 text-subtle"
              >
                <Search className="size-5" /> Search apps, categories…
              </button>
            </div>
            <ul className="container-page mt-6 flex flex-col">
              {links.map((l, i) => (
                <motion.li key={l.to} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i + 0.05 }}>
                  <NavLink
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) =>
                      cn('flex items-center justify-between border-b border-line py-4 font-display text-2xl font-bold tracking-tight', isActive ? 'text-accent-text' : 'text-fg')
                    }
                  >
                    {l.label}
                    <ArrowRight className="size-5 text-subtle" />
                  </NavLink>
                </motion.li>
              ))}
            </ul>
            <div className="container-page mt-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <ButtonLink to={isAuthenticated ? '/dashboard' : '/login'} size="lg" variant="secondary" className="w-full">
                {isAuthenticated ? 'Open dashboard' : 'Manager login'}
              </ButtonLink>
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="lg"
                  className="mt-2 w-full text-danger hover:bg-danger-soft hover:text-danger"
                  leftIcon={<LogOut className="size-4" />}
                  onClick={() => {
                    setMobileOpen(false)
                    requestSignOut()
                  }}
                >
                  Sign out
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
