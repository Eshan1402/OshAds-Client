import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ExternalLink, LayoutDashboard, LogOut, Moon, Settings, Sun } from 'lucide-react'
import { useCallback, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { roleLabels } from '@/data/users'
import { queryClient } from '@/services/queryClient'
import { cn } from '@/utils/cn'
import { Avatar } from '@/components/ui/Misc'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Popover } from '@/components/ui/Popover'

/* Tiny global store so any menu, page or shortcut can request sign-out. */
let open = false
const subs = new Set<() => void>()
const setOpen = (v: boolean) => {
  open = v
  subs.forEach((f) => f())
}
export const requestSignOut = () => setOpen(true)
const useSignOutOpen = () =>
  useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => open,
  )

/** Confirmation dialog — mounted once per layout. Signing out is reversible but loses unsaved work, so we confirm. */
export function SignOutDialog() {
  const isOpen = useSignOutOpen()
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [pending, setPending] = useState(false)

  const confirm = useCallback(async () => {
    setPending(true)
    await new Promise((r) => setTimeout(r, 350))
    const name = session?.user.name.split(' ')[0]
    logout()
    queryClient.invalidate('')
    setOpen(false)
    setPending(false)
    navigate('/login', { replace: true, state: { signedOut: true } })
    toast({ tone: 'success', title: `Signed out${name ? `. See you soon, ${name}` : ''}`, description: 'Your session has ended on this device.' })
  }, [logout, navigate, session, toast])

  if (!session && !isOpen) return null
  return (
    <Modal
      open={isOpen}
      onClose={() => !pending && setOpen(false)}
      size="sm"
      title="Sign out of OshAds?"
      description="You’ll need to sign in again to manage campaigns. Any unsaved changes on this page will be lost."
      footer={
        <>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Stay signed in</Button>
          <Button variant="danger" onClick={confirm} loading={pending} leftIcon={<LogOut className="size-4" />} data-autofocus>
            Sign out
          </Button>
        </>
      }
    >
      {session && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/60 p-3">
          <Avatar name={session.user.name} color={session.user.avatarColor} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-fg">{session.user.name}</p>
            <p className="truncate text-xs text-subtle">{session.user.email}</p>
          </div>
        </div>
      )}
    </Modal>
  )
}

/** Avatar + account dropdown with an always-visible sign-out entry. */
export function AccountMenu({ variant = 'dashboard' }: { variant?: 'dashboard' | 'public' }) {
  const { session } = useAuth()
  const { resolved, toggle } = useTheme()
  if (!session) return null
  const u = session.user
  const item = 'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 [&>svg]:size-4 [&>svg]:text-subtle'
  return (
    <Popover
      panelClassName="w-64 p-1.5"
      trigger={({ toggle: t, open: o, id }) => (
        <button
          onClick={t}
          aria-expanded={o}
          aria-controls={id}
          aria-label={`Account menu for ${u.name}`}
          className={cn('flex items-center gap-2 rounded-full p-0.5 pr-2 transition hover:bg-surface-2', o && 'bg-surface-2')}
        >
          <Avatar name={u.name} color={u.avatarColor} size="sm" />
          <ChevronDown className={cn('size-3.5 text-subtle transition-transform duration-200', o && 'rotate-180')} aria-hidden />
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center gap-3 px-2.5 pb-3 pt-2">
            <Avatar name={u.name} color={u.avatarColor} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fg">{u.name}</p>
              <p className="truncate text-xs text-subtle">{u.email}</p>
              <p className="mt-1 inline-flex rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent-text">{roleLabels[u.role]} · {u.title}</p>
            </div>
          </div>
          <div className="my-1 h-px bg-line" role="separator" />
          {variant === 'public' ? (
            <Link to="/dashboard" onClick={close} className={item}><LayoutDashboard /> Open dashboard</Link>
          ) : (
            <Link to="/" target="_blank" onClick={close} className={item}><ExternalLink /> View public site</Link>
          )}
          <Link to="/dashboard/settings" onClick={close} className={item}><Settings /> Profile & settings</Link>
          <button onClick={toggle} className={item}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={resolved} initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ opacity: 0 }} className="flex">
                {resolved === 'dark' ? <Sun className="size-4 text-subtle" /> : <Moon className="size-4 text-subtle" />}
              </motion.span>
            </AnimatePresence>
            {resolved === 'dark' ? 'Light appearance' : 'Dark appearance'}
          </button>
          <div className="my-1 h-px bg-line" role="separator" />
          <button
            onClick={() => {
              close()
              requestSignOut()
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-danger-soft focus-visible:bg-danger-soft"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}
    </Popover>
  )
}
