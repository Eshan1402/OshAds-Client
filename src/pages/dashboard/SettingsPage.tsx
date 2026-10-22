import { Laptop, LogOut, Monitor, Moon, RotateCcw, ShieldCheck, Smartphone, Sun } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme, type ThemePreference } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { rolePermissions, roleLabels, users } from '@/data/users'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { resetDemoData } from '@/services/api'
import type { Permission, Role } from '@/types'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/format'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select, Switch } from '@/components/ui/Form'
import { Avatar } from '@/components/ui/Misc'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/SegmentedControl'
import { requestSignOut } from '@/components/auth/SignOut'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { PageTransition } from '@/components/layout/PageTransition'

type Tab = 'profile' | 'appearance' | 'notifications' | 'team' | 'integrations' | 'security'

const permissionLabels: Record<Permission, string> = {
  'analytics:read': 'View analytics',
  'campaigns:write': 'Create & edit campaigns',
  'apps:write': 'Manage applications',
  'clients:write': 'Manage clients',
  'reports:export': 'Export reports',
  'settings:manage': 'Workspace settings',
  'team:manage': 'Manage team & roles',
}

export default function SettingsPage() {
  useDocumentTitle('Settings')
  const { can } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab | null) ?? 'profile'
  const tabs: Array<{ value: Tab; label: string }> = [
    { value: 'profile', label: 'Profile' },
    { value: 'appearance', label: 'Appearance' },
    { value: 'notifications', label: 'Notifications' },
    ...(can('team:manage') ? [{ value: 'team' as Tab, label: 'Team & roles' }] : []),
    { value: 'integrations', label: 'Integrations' },
    { value: 'security', label: 'Security' },
  ]
  return (
    <PageTransition>
      <PageHeader title="Settings" description="Manage your profile, preferences and workspace." />
      <Tabs className="mb-6" tabs={tabs} value={tab} onChange={(v) => setParams({ tab: v })} />
      <div className="max-w-3xl space-y-6">
        {tab === 'profile' && <Profile />}
        {tab === 'appearance' && <Appearance />}
        {tab === 'notifications' && <NotificationPrefs />}
        {tab === 'team' && can('team:manage') && <Team />}
        {tab === 'integrations' && <Integrations />}
        {tab === 'security' && <Security />}
      </div>
    </PageTransition>
  )
}

function Profile() {
  const { session } = useAuth()
  const toast = useToast()
  const u = session!.user
  const [name, setName] = useState(u.name)
  const [title, setTitle] = useState(u.title)
  return (
    <Card>
      <CardHeader title="Profile" description="How you appear to teammates and clients." />
      <CardBody className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar name={name} color={u.avatarColor} size="lg" />
          <div>
            <p className="font-semibold text-fg">{name}</p>
            <p className="text-sm text-subtle">{u.email} · <Badge tone="accent">{roleLabels[u.role]}</Badge></p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">{({ id }) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
          <Field label="Job title">{({ id }) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} />}</Field>
          <Field label="Email" hint="Contact an admin to change your sign-in email.">{({ id, describedBy }) => <Input id={id} value={u.email} disabled aria-describedby={describedBy} />}</Field>
          <Field label="Timezone">{({ id }) => <Select id={id} defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}><option>{Intl.DateTimeFormat().resolvedOptions().timeZone}</option><option>UTC</option><option>Europe/London</option><option>America/New_York</option><option>Asia/Kolkata</option></Select>}</Field>
        </div>
        <div className="flex justify-end"><Button onClick={() => toast({ tone: 'success', title: 'Profile saved' })}>Save profile</Button></div>
      </CardBody>
    </Card>
  )
}

function Appearance() {
  const { preference, setPreference } = useTheme()
  const opts: Array<{ v: ThemePreference; label: string; icon: React.ReactNode }> = [
    { v: 'light', label: 'Light', icon: <Sun className="size-4" /> },
    { v: 'dark', label: 'Dark', icon: <Moon className="size-4" /> },
    { v: 'system', label: 'System', icon: <Monitor className="size-4" /> },
  ]
  return (
    <Card>
      <CardHeader title="Theme" description="Applies to the dashboard and public site on this device." />
      <CardBody>
        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Theme">
          {opts.map((o) => (
            <button key={o.v} role="radio" aria-checked={preference === o.v} onClick={() => setPreference(o.v)}
              className={cn('overflow-hidden rounded-xl border text-left transition', preference === o.v ? 'border-accent ring-1 ring-accent' : 'border-line hover:border-line-strong')}>
              <div className={cn('h-20 p-3', o.v === 'dark' ? 'bg-ink-950' : o.v === 'light' ? 'bg-ink-50' : 'bg-[linear-gradient(90deg,var(--color-ink-50)_50%,var(--color-ink-950)_50%)]')}>
                <div className="h-2 w-12 rounded-full bg-brand-500" />
                <div className={cn('mt-2 h-8 rounded-md', o.v === 'dark' ? 'bg-ink-850' : 'bg-white shadow-sm')} />
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-fg">{o.icon}{o.label}</div>
            </button>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

function NotificationPrefs() {
  const [prefs, setPrefs] = useLocalStorage('adwin:notif-prefs', { milestones: true, budget: true, performance: true, system: true, digest: false, email: true })
  const set = (k: keyof typeof prefs) => (v: boolean) => setPrefs({ ...prefs, [k]: v })
  return (
    <Card>
      <CardHeader title="Notification preferences" description="Choose which events notify you in-app and by email." />
      <CardBody className="space-y-5 divide-y divide-line [&>*:not(:first-child)]:pt-5">
        <Switch checked={prefs.milestones} onChange={set('milestones')} label="Campaign milestones" description="When a campaign hits 50%, 80% and 100% of its target." />
        <Switch checked={prefs.budget} onChange={set('budget')} label="Budget alerts" description="When daily or total spend passes 85%." />
        <Switch checked={prefs.performance} onChange={set('performance')} label="Performance changes" description="Significant CTR or conversion movements (±10%)." />
        <Switch checked={prefs.system} onChange={set('system')} label="System status" description="Tracking or postback incidents affecting attribution." />
        <Switch checked={prefs.email} onChange={set('email')} label="Email delivery" description="Also send critical alerts to your inbox." />
        <Switch checked={prefs.digest} onChange={set('digest')} label="Weekly digest" description="A Monday summary of last week’s performance." />
      </CardBody>
    </Card>
  )
}

function Team() {
  const roles: Role[] = ['admin', 'manager', 'analyst']
  const perms = Object.keys(permissionLabels) as Permission[]
  return (
    <>
      <Card>
        <CardHeader title="Team members" />
        <CardBody className="px-0 sm:px-0">
          <ul className="divide-y divide-line">
            {users.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                <Avatar name={u.name} color={u.avatarColor} size="sm" />
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-fg">{u.name}</span><span className="block text-xs text-subtle">{u.email}</span></span>
                <Badge tone={u.role === 'admin' ? 'accent' : u.role === 'manager' ? 'iris' : 'neutral'}>{roleLabels[u.role]}</Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader title="Role permissions" description="Enforced in navigation and on every protected route." className="pb-4" />
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-line text-left text-xs text-subtle"><th className="px-5 py-2.5 font-medium">Permission</th>{roles.map((r) => <th key={r} className="px-3 py-2.5 text-center font-medium">{roleLabels[r]}</th>)}</tr></thead>
            <tbody>
              {perms.map((p) => (
                <tr key={p} className="border-b border-line last:border-0">
                  <td className="px-5 py-2.5 text-fg">{permissionLabels[p]}</td>
                  {roles.map((r) => <td key={r} className="px-3 py-2.5 text-center">{rolePermissions[r].includes(p) ? <span className="text-success" aria-label="Allowed">●</span> : <span className="text-line-strong" aria-label="Not allowed">○</span>}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

function Integrations() {
  const partners = [
    ['AppsFlyer', true], ['Adjust', true], ['Branch', true], ['Singular', false], ['Kochava', false],
  ] as const
  return (
    <>
      <Card>
        <CardHeader title="Tracking" description="Domains and endpoints used for click attribution." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Click tracking domain">{({ id }) => <Input id={id} value="trk.oshads.com" readOnly className="font-mono text-xs" />}</Field>
          <Field label="Postback endpoint">{({ id }) => <Input id={id} value="pb.oshads.com/v2/postback" readOnly className="font-mono text-xs" />}</Field>
          <Field label="Default attribution window">{({ id }) => <Select id={id} defaultValue="7"><option value="1">1 day</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></Select>}</Field>
          <Field label="Fraud filtering">{({ id }) => <Select id={id} defaultValue="strict"><option value="standard">Standard</option><option value="strict">Strict (recommended)</option></Select>}</Field>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Attribution partners" />
        <CardBody className="grid gap-3 sm:grid-cols-2">
          {partners.map(([name, on]) => (
            <div key={name} className="flex items-center justify-between rounded-xl border border-line p-3.5">
              <span className="text-sm font-semibold text-fg">{name}</span>
              <Badge tone={on ? 'success' : 'neutral'} dot>{on ? 'Connected' : 'Not connected'}</Badge>
            </div>
          ))}
        </CardBody>
      </Card>
    </>
  )
}

function Security() {
  const { session } = useAuth()
  const [confirmReset, setConfirmReset] = useState(false)
  return (
    <>
      <Card>
        <CardHeader title="Active sessions" description={`This session expires ${formatDate(new Date(session!.expiresAt).toISOString())}.`} />
        <CardBody className="space-y-2">
          {[
            { icon: <Laptop className="size-4" />, name: 'This browser', meta: 'Current session', current: true },
            { icon: <Smartphone className="size-4" />, name: 'iPhone · Safari', meta: 'Last active 2 days ago', current: false },
          ].map((s) => (
            <div key={s.name} className="flex items-center gap-3 rounded-xl border border-line p-3">
              <span className="grid size-9 place-items-center rounded-lg bg-surface-2 text-subtle">{s.icon}</span>
              <span className="flex-1"><span className="block text-sm font-semibold text-fg">{s.name}</span><span className="block text-xs text-subtle">{s.meta}</span></span>
              {s.current ? <Badge tone="success" dot>Active</Badge> : <Button variant="ghost" size="sm">Revoke</Button>}
            </div>
          ))}
          <div className="flex justify-end pt-2"><Button variant="outline" leftIcon={<LogOut className="size-4" />} onClick={requestSignOut}>Sign out</Button></div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Two-factor authentication" description="Required for admins once the production backend is connected." action={<ShieldCheck className="size-5 text-success" />} />
        <CardBody><p className="text-sm text-muted">Authenticator app enrollment will be available after SSO/SAML is enabled for your workspace.</p></CardBody>
      </Card>
      <Card>
        <CardHeader title="Demo data" description="Campaigns, apps and clients you create are stored in this browser." />
        <CardBody>
          <Button variant="outline" leftIcon={<RotateCcw className="size-4" />} onClick={() => setConfirmReset(true)}>Reset demo data</Button>
        </CardBody>
      </Card>
      <ConfirmDialog open={confirmReset} onClose={() => setConfirmReset(false)} onConfirm={resetDemoData} title="Reset demo data?" description="All apps, campaigns, clients and reports on the server will be replaced with the original sample data, for everyone." confirmLabel="Reset data" />
    </>
  )
}
