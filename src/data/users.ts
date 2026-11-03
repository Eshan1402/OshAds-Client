import type { Permission, Role, User } from '@/types'

/** The staff accounts. Accounts and password hashes live on the server (server/auth.ts seeds them). */
export const users: User[] = [
  { id: 'u_priya', name: 'Shobit', email: 'shobit@oshads.com', role: 'admin', title: 'Head of Growth', avatarColor: '#1B3FD0' },
]

export const rolePermissions: Record<Role, Permission[]> = {
  admin: ['analytics:read', 'campaigns:write', 'apps:write', 'clients:write', 'reports:export', 'settings:manage', 'team:manage'],
  manager: ['analytics:read', 'campaigns:write', 'apps:write', 'clients:write', 'reports:export'],
  analyst: ['analytics:read', 'reports:export'],
}

export const roleLabels: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  analyst: 'Analyst',
}
