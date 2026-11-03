import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '@/context/ToastContext'
import { users } from '@/data/users'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { clientsService } from '@/services/clientsService'
import { queryClient } from '@/services/queryClient'
import type { Client } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Field, Input, Select } from '@/components/ui/Form'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { ClientLogo } from './ClientsPage'

type Draft = Omit<Client, 'id' | 'since'>
const blank: Draft = { name: '', company: '', contactName: '', contactEmail: '', industry: '', country: '', logoColors: ['#60A5FA', '#1D4ED8'], status: 'onboarding', tier: 'Growth', accountManagerId: 'u_priya' }
const swatches: Array<[string, string]> = [['#60A5FA', '#1D4ED8'], ['#34D399', '#047857'], ['#F472B6', '#9D174D'], ['#A78BFA', '#4C1D95'], ['#FB923C', '#9A3412'], ['#22D3EE', '#164E63'], ['#94A3B8', '#1E293B']]

export default function ClientFormPage() {
  const { id } = useParams()
  useDocumentTitle(id ? 'Edit client' : 'Add client')
  const navigate = useNavigate()
  const toast = useToast()
  const existing = useQuery(id ? `clients:detail:${id}` : null, () => clientsService.get(id!))
  const [d, setD] = useState<Draft>(blank)
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({})
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (existing.data) setD(existing.data) }, [existing.data])
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setD((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })) }

  const save = async () => {
    const e: typeof errors = {}
    if (d.name.trim().length < 2) e.name = 'Client name is required.'
    if (!d.company.trim()) e.company = 'Legal company name is required.'
    if (!d.contactName.trim()) e.contactName = 'Add a primary contact.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.contactEmail)) e.contactEmail = 'Enter a valid email address.'
    setErrors(e)
    if (Object.keys(e).length) return
    setSaving(true)
    try {
      const saved = id ? await clientsService.update(id, d) : await clientsService.create(d)
      queryClient.invalidate('clients')
      toast({ tone: 'success', title: id ? 'Client updated' : 'Client added', description: saved.name })
      navigate(`/dashboard/clients/${saved.id}`)
    } catch (err) {
      toast({ tone: 'error', title: 'Couldn’t save client', description: (err as Error).message })
      setSaving(false)
    }
  }

  if (id && existing.error) return <ErrorState error={existing.error} onRetry={existing.refetch} />
  if (id && !existing.data) return <Skeleton className="h-96" />

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={id ? `Edit ${existing.data?.name}` : 'Add client'}
        description="App publishers you run campaigns for."
        actions={<><Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button><Button onClick={save} loading={saving}>{id ? 'Save changes' : 'Add client'}</Button></>}
      />
      <Card>
        <CardHeader title="Company" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Client name" required error={errors.name}>{({ id: fid, invalid }) => <Input id={fid} invalid={invalid} value={d.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Northwind Fintech" />}</Field>
          <Field label="Legal company name" required error={errors.company}>{({ id: fid, invalid }) => <Input id={fid} invalid={invalid} value={d.company} onChange={(e) => set('company', e.target.value)} />}</Field>
          <Field label="Industry">{({ id: fid }) => <Input id={fid} value={d.industry} onChange={(e) => set('industry', e.target.value)} />}</Field>
          <Field label="Country">{({ id: fid }) => <Input id={fid} value={d.country} onChange={(e) => set('country', e.target.value)} />}</Field>
          <Field label="Tier">{({ id: fid }) => <Select id={fid} value={d.tier} onChange={(e) => set('tier', e.target.value as Draft['tier'])}><option>Enterprise</option><option>Growth</option><option>Starter</option></Select>}</Field>
          <Field label="Status">{({ id: fid }) => <Select id={fid} value={d.status} onChange={(e) => set('status', e.target.value as Draft['status'])}><option value="onboarding">Onboarding</option><option value="active">Active</option><option value="paused">Paused</option><option value="churned">Churned</option></Select>}</Field>
          <Field label="Brand colour" className="sm:col-span-2">
            {() => (
              <div className="flex items-center gap-3">
                <ClientLogo client={{ name: d.name || 'New Client', logoColors: d.logoColors }} />
                <div className="flex gap-1.5">
                  {swatches.map((s) => (
                    <button key={s[0]} type="button" onClick={() => set('logoColors', s)} aria-label={`Colour ${s[0]}`} aria-pressed={d.logoColors[0] === s[0]} className={`size-7 rounded-lg ring-offset-2 ring-offset-surface ${d.logoColors[0] === s[0] ? 'ring-2 ring-accent' : ''}`} style={{ background: `linear-gradient(140deg, ${s[0]}, ${s[1]})` }} />
                  ))}
                </div>
              </div>
            )}
          </Field>
        </CardBody>
      </Card>
      <Card className="mt-6">
        <CardHeader title="Contacts" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary contact" required error={errors.contactName}>{({ id: fid, invalid }) => <Input id={fid} invalid={invalid} value={d.contactName} onChange={(e) => set('contactName', e.target.value)} />}</Field>
          <Field label="Contact email" required error={errors.contactEmail}>{({ id: fid, invalid }) => <Input id={fid} invalid={invalid} type="email" value={d.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />}</Field>
          <Field label="Account manager">{({ id: fid }) => <Select id={fid} value={d.accountManagerId} onChange={(e) => set('accountManagerId', e.target.value)}>{users.filter((u) => u.role !== 'analyst').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>}</Field>
        </CardBody>
      </Card>
    </div>
  )
}
