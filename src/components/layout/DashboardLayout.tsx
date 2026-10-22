import { Suspense, useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { DashboardProvider } from '@/context/DashboardContext'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { loadDb } from '@/services/api'
import { queryClient } from '@/services/queryClient'
import { SignOutDialog } from '@/components/auth/SignOut'
import { AmbientBackdrop } from './AmbientBackdrop'
import { PageLoader } from './PageLoader'
import { ScrollToTop } from './ScrollToTop'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useLocalStorage('adwin:sidebar-collapsed', false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeMobile = useCallback(() => setMobileOpen(false), [])
  // Live numbers: re-read counts every 15 s. Detail/edit queries are left alone so open forms aren't overwritten.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.hidden) return
      loadDb('staff')
        .then(() => ['analytics', 'campaigns:list', 'clients:list'].forEach((k) => queryClient.invalidate(k)))
        .catch(() => {})
    }, 15_000)
    return () => clearInterval(t)
  }, [])
  return (
    <DashboardProvider>
      <ScrollToTop />
      <div className="relative isolate flex min-h-dvh">
        <AmbientBackdrop subtle />
        <Sidebar collapsed={collapsed} onCollapse={() => setCollapsed((c) => !c)} mobileOpen={mobileOpen} onMobileClose={closeMobile} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={() => setMobileOpen(true)} />
          <main id="main" className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
      <SignOutDialog />
    </DashboardProvider>
  )
}

export function PageHeader({ title, description, actions, eyebrow }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; eyebrow?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 text-[13px] text-subtle">{eyebrow}</div>}
        <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-fg sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
