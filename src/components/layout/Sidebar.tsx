import { AnimatePresence, motion } from 'framer-motion'
import {
  AppWindow, BarChart3, Building2, ChevronDown, ChevronsLeft, FileBarChart, LayoutDashboard, LogOut, Megaphone, Radio, Settings, X, Gift } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { roleLabels } from '@/data/users'
import type { Permission } from '@/types'
import { cn } from '@/utils/cn'
import { requestSignOut } from '@/components/auth/SignOut'
import { Logo } from '@/components/ui/Logo'
import { Avatar } from '@/components/ui/Misc'
import { Menu } from '@/components/ui/Popover'
import { Tooltip } from '@/components/ui/Popover'

interface NavChild {
  to: string
  label: string
  permission?: Permission
}
interface NavItem {
  label: string
  icon: ReactNode
  to?: string
  end?: boolean
  match?: string
  children?: NavChild[]
  permission?: Permission
}

const nav: NavItem[] = [
  { label: 'Overview', icon: <LayoutDashboard />, to: '/dashboard', end: true },
  {
    label: 'Campaigns', icon: <Megaphone />, match: '/dashboard/campaigns',
    children: [
      { to: '/dashboard/campaigns', label: 'All campaigns' },
      { to: '/dashboard/campaigns?status=active', label: 'Active' },
      { to: '/dashboard/campaigns?status=scheduled', label: 'Scheduled' },
      { to: '/dashboard/campaigns?status=completed', label: 'Completed' },
    ],
  },
  {
    label: 'Applications', icon: <AppWindow />, match: '/dashboard/apps',
    children: [
      { to: '/dashboard/apps', label: 'All apps' },
      { to: '/dashboard/apps/new', label: 'Add application', permission: 'apps:write' },
    ],
  },
  {
    label: 'Clients', icon: <Building2 />, match: '/dashboard/clients',
    children: [
      { to: '/dashboard/clients', label: 'All clients' },
      { to: '/dashboard/clients/new', label: 'Add client', permission: 'clients:write' },
    ],
  },
  {
    label: 'Analytics', icon: <BarChart3 />, match: '/dashboard/analytics',
    children: [
      { to: '/dashboard/analytics#traffic', label: 'Traffic' },
      { to: '/dashboard/analytics#downloads', label: 'Downloads' },
      { to: '/dashboard/analytics#conversion', label: 'Conversion' },
      { to: '/dashboard/analytics#sources', label: 'Sources' },
      { to: '/dashboard/analytics#geography', label: 'Geography' },
    ],
  },
  {
    label: 'Traffic', icon: <Radio />, match: '/dashboard/traffic',
    children: [
      { to: '/dashboard/traffic?view=sources', label: 'Traffic sources' },
      { to: '/dashboard/traffic?view=referral', label: 'Referral sources' },
      { to: '/dashboard/traffic?view=organic', label: 'Organic traffic' },
    ],
  },
  { label: 'Rewards', icon: <Gift />, to: '/dashboard/rewards' },
  { label: 'Reports', icon: <FileBarChart />, to: '/dashboard/reports', permission: 'reports:export' },
  { label: 'Settings', icon: <Settings />, to: '/dashboard/settings' },
]

export function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }: { collapsed: boolean; onCollapse: () => void; mobileOpen: boolean; onMobileClose: () => void }) {
  const location = useLocation()
  useEffect(() => onMobileClose(), [location.pathname, location.search, onMobileClose])

  return (
    <>
      <aside
        className={cn(
          'no-print sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface/45 backdrop-blur-2xl backdrop-saturate-150 transition-[width] duration-300 ease-[var(--ease-out-expo)] lg:flex',
          collapsed ? 'w-[72px]' : 'w-64',
        )}
        aria-label="Dashboard navigation"
      >
        <SidebarContent collapsed={collapsed} onCollapse={onCollapse} />
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-ink-950/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onMobileClose} />
            <motion.aside
              className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-line glass-strong"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              aria-label="Dashboard navigation"
            >
              <button onClick={onMobileClose} className="absolute right-3 top-4 grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2" aria-label="Close navigation">
                <X className="size-4" />
              </button>
              <SidebarContent collapsed={false} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

function SidebarContent({ collapsed, onCollapse }: { collapsed: boolean; onCollapse?: () => void }) {
  const { can, session } = useAuth()
  const location = useLocation()
  const items = nav.filter((n) => !n.permission || can(n.permission))
  const [open, setOpen] = useState<string | null>(() => items.find((i) => i.match && location.pathname.startsWith(i.match))?.label ?? 'Campaigns')

  useEffect(() => {
    const m = items.find((i) => i.match && location.pathname.startsWith(i.match))
    if (m) setOpen(m.label)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const user = session!.user

  return (
    <>
      <div className={cn('flex h-16 items-center px-4', collapsed && 'justify-center px-0')}>
        <Link to="/dashboard" aria-label="Dashboard home">
          <Logo compact={collapsed} />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-2 scrollbar-none">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const sectionActive = item.match ? location.pathname.startsWith(item.match) : false
            if (!item.children) {
              const link = (
                <NavLink
                  to={item.to!}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'group flex h-9 items-center gap-3 rounded-[10px] px-2.5 text-[13.5px] font-medium transition-colors [&>svg]:size-[18px] [&>svg]:shrink-0',
                      isActive ? 'bg-accent-soft text-accent-text' : 'text-muted hover:bg-surface-2 hover:text-fg',
                      collapsed && 'justify-center px-0',
                    )
                  }
                >
                  {item.icon}
                  {!collapsed && item.label}
                </NavLink>
              )
              return <li key={item.label}>{collapsed ? <Tooltip content={item.label} side="right">{link}</Tooltip> : link}</li>
            }
            const expanded = open === item.label && !collapsed
            const children = item.children.filter((c) => !c.permission || can(c.permission))
            return (
              <li key={item.label}>
                {collapsed ? (
                  <Tooltip content={item.label} side="right">
                    <Link
                      to={children[0].to}
                      className={cn('flex h-9 w-full items-center justify-center rounded-[10px] transition-colors [&>svg]:size-[18px]', sectionActive ? 'bg-accent-soft text-accent-text' : 'text-muted hover:bg-surface-2 hover:text-fg')}
                      aria-label={item.label}
                    >
                      {item.icon}
                    </Link>
                  </Tooltip>
                ) : (
                  <button
                    onClick={() => setOpen(expanded ? null : item.label)}
                    aria-expanded={expanded}
                    className={cn(
                      'flex h-9 w-full items-center gap-3 rounded-[10px] px-2.5 text-[13.5px] font-medium transition-colors [&>svg]:size-[18px] [&>svg]:shrink-0',
                      sectionActive ? 'text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
                    )}
                  >
                    {item.icon}
                    {item.label}
                    <ChevronDown className={cn('ml-auto !size-3.5 text-subtle transition-transform duration-200', expanded && 'rotate-180')} />
                  </button>
                )}
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                      <ul className="relative ml-[21px] mt-0.5 space-y-0.5 border-l border-line pb-1 pl-3">
                        {children.map((c) => {
                          const active = isChildActive(c.to, location)
                          return (
                            <li key={c.to}>
                              <Link to={c.to} aria-current={active ? 'page' : undefined} className={cn('relative flex h-8 items-center rounded-lg px-2.5 text-[13px] transition-colors', active ? 'font-semibold text-fg' : 'text-subtle hover:text-fg')}>
                                {active && <motion.span layoutId="sidebar-child" className="absolute -left-[13px] top-1.5 h-5 w-0.5 rounded-full bg-accent" />}
                                {c.label}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="border-t border-line p-3">
        {onCollapse && (
          <button onClick={onCollapse} className={cn('mb-2 flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-subtle transition hover:bg-surface-2 hover:text-fg', collapsed && 'justify-center px-0')} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <ChevronsLeft className={cn('size-4 transition-transform duration-300', collapsed && 'rotate-180')} />
            {!collapsed && 'Collapse'}
          </button>
        )}
        <Menu
          label="Account"
          align="start"
          trigger={({ toggle, open }) => (
            <button onClick={toggle} aria-expanded={open} className={cn('flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-surface-2', collapsed && 'justify-center p-1')}>
              <Avatar name={user.name} color={user.avatarColor} />
              {!collapsed && (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-fg">{user.name}</span>
                  <span className="block truncate text-xs text-subtle">{user.title} · {roleLabels[user.role]}</span>
                </span>
              )}
            </button>
          )}
          items={[
            { label: 'Profile & settings', icon: <Settings />, href: '/dashboard/settings' },
            { label: 'View public site', icon: <AppWindow />, href: '/' },
            { label: 'Sign out', icon: <LogOut />, onSelect: requestSignOut, danger: true, separatorBefore: true },
          ]}
        />
      </div>
    </>
  )
}

function isChildActive(to: string, location: { pathname: string; search: string; hash: string }) {
  const [pathAndQuery, hash] = to.split('#')
  const [path, query] = pathAndQuery.split('?')
  if (location.pathname !== path) return false
  if (hash) return location.hash === `#${hash}` || (!location.hash && hash === 'traffic')
  const want = new URLSearchParams(query ?? '')
  const have = new URLSearchParams(location.search)
  if (!query) return !have.get('status') && !have.get('view')
  return [...want.entries()].every(([k, v]) => have.get(k) === v) || (want.get('view') === 'sources' && !have.get('view'))
}
