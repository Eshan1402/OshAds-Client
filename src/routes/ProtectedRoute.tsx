import { ShieldOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { Permission } from '@/types'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'

/** Gate for authenticated areas. Unauthenticated users are sent to /login and returned afterwards. */
export function ProtectedRoute({ children, permission }: { children: ReactNode; permission?: Permission }) {
  const { isAuthenticated, can } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />
  if (permission && !can(permission)) {
    return (
      <EmptyState
        icon={<ShieldOff />}
        title="You don’t have access to this area"
        description="Your role doesn’t include this permission. Ask an OshAds admin if you need it."
        action={<ButtonLink to="/dashboard" variant="outline">Back to overview</ButtonLink>}
      />
    )
  }
  return <>{children}</>
}
