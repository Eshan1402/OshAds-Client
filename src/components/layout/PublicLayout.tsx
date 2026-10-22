import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { track } from '@/lib/track'
import { SignOutDialog } from '@/components/auth/SignOut'
import { SearchOverlay } from '@/components/search/SearchOverlay'
import { CustomCursor } from '@/components/motion/CustomCursor'
import { AmbientBackdrop } from './AmbientBackdrop'
import { ScrollProgress } from '@/components/motion/ScrollProgress'
import { PageLoader } from './PageLoader'
import { PublicFooter } from './PublicFooter'
import { PublicNav } from './PublicNav'
import { ScrollToTop } from './ScrollToTop'

export function PublicLayout() {
  const { pathname } = useLocation()
  useEffect(() => track('page_view'), [pathname]) // public pages only; staff dashboard views are not traffic
  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <AmbientBackdrop />
      <ScrollProgress />
      <ScrollToTop />
      <PublicNav />
      <main id="main" className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <PublicFooter />
      <SearchOverlay />
      <SignOutDialog />
      <CustomCursor />
    </div>
  )
}
