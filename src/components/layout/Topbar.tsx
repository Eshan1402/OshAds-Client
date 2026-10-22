import { Menu as MenuIcon, Plus, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ButtonLink } from '@/components/ui/Button'
import { Input } from '@/components/ui/Form'
import { LiveVisitors } from '@/components/analytics/Panels'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { AccountMenu } from '@/components/auth/SignOut'
import { ThemeToggle } from './ThemeToggle'

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { can } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (q.trim()) navigate(`/dashboard/campaigns?q=${encodeURIComponent(q.trim())}`)
  }
  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/50 px-4 backdrop-blur-2xl backdrop-saturate-150 sm:px-6">
      <button onClick={onMenu} className="grid size-11 place-items-center rounded-full text-fg hover:bg-surface-2 sm:size-9 lg:hidden" aria-label="Open navigation">
        <MenuIcon className="size-5" />
      </button>
      <form onSubmit={submit} role="search" className="hidden w-full max-w-sm sm:block">
        <Input inputSize="sm" leftIcon={<Search />} placeholder="Search campaigns…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search campaigns" className="bg-surface" />
      </form>
      <div className="ml-auto flex items-center gap-1.5">
        <div className="hidden md:block"><LiveVisitors /></div>
        <NotificationCenter />
        <ThemeToggle />
        {can('campaigns:write') && (
          <ButtonLink to="/dashboard/campaigns/new" size="sm" leftIcon={<Plus className="size-4" />} className="ml-1.5">
            <span className="hidden sm:inline">New campaign</span>
            <span className="sm:hidden">New</span>
          </ButtonLink>
        )}
        <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />
        <AccountMenu />
      </div>
    </header>
  )
}
