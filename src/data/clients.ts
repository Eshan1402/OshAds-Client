import type { Client } from '@/types'
import { slugify } from '@/utils/format'
import { brands } from './brands'
import { categoryBySlug } from './categories'

// Contact, legal name and tier weren't in the client table: fill them in from Dashboard → Clients.
export const clients: Client[] = brands.map((b) => ({
  id: `cl_${slugify(b.name)}`,
  name: b.name,
  company: b.name,
  contactName: '',
  contactEmail: '',
  industry: categoryBySlug[b.category].name,
  country: b.country ?? '',
  logoColors: ['#10B981', '#047857'],
  status: 'active',
  since: '2026-10-21',
  tier: 'Starter',
  accountManagerId: 'u_marcus',
  website: b.website,
  linkedinUrl: b.linkedin,
  logo: b.logo,
}))
