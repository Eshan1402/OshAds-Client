import { ApiError } from './api'

export interface WalletItem {
  appId: string
  coins: number
  status: 'pending' | 'confirmed' | 'rejected'
  createdAt: number
  decidedAt: number | null
}
export interface Wallet {
  balance: number
  pending: number
  items: WalletItem[]
}
export interface RewardForReview {
  id: number
  walletId: string
  appId: string
  clickId: string
  coins: number
  status: string
  createdAt: number
  country: string | null
  device: string | null
}

const KEY = 'osh:wallet'

/** The visitor's anonymous Osh-coin wallet, kept only in this browser. Created on first Download click. */
export function walletId(create = false): string | null {
  try {
    let id = localStorage.getItem(KEY)
    if (!id && create) {
      id = crypto.randomUUID()
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return null // storage blocked (private mode): downloads still work, coins can't be kept
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init).catch(() => {
    throw new ApiError('Can’t reach the server. Check your connection.', 0)
  })
  const body = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(body?.error ?? 'Something went wrong. Try again.', res.status)
  return body as T
}

export const rewardsService = {
  async wallet(): Promise<Wallet> {
    const id = walletId()
    return id ? call<Wallet>(`/api/wallet/${id}`) : { balance: 0, pending: 0, items: [] }
  },
  forReview: (status: 'pending' | 'confirmed' | 'rejected') => call<RewardForReview[]>(`/api/admin/rewards?status=${status}`),
  confirm: (id: number) => call<null>(`/api/admin/rewards/${id}/confirm`, { method: 'POST' }),
  reject: (id: number) => call<null>(`/api/admin/rewards/${id}/reject`, { method: 'POST' }),
}
