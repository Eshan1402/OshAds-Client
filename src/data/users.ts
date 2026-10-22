import type { Permission, Role, User } from '@/types'

/** The starter team. Accounts and password hashes live on the server (server/auth.ts seeds them). */
export const users: User[] = [
  { id: 'u_priya', name: 'Priya Raman', email: 'priya@oshads.com', role: 'admin', title: 'Head of Growth', avatarColor: '#1B3FD0' },
  { id: 'u_marcus', name: 'Marcus Lee', email: 'marcus@oshads.com', role: 'manager', title: 'Campaign Manager', avatarColor: '#6C63F0' },
  { id: 'u_dana', name: 'Dana Okafor', email: 'dana@oshads.com', role: 'analyst', title: 'Performance Analyst', avatarColor: '#14B8A6' },
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
