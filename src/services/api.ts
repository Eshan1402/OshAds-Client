import type { AppNotification, Campaign, Client, MobileApp, SavedReport } from '@/types'

/**
 * Transport. Services read from `db`, a local copy loaded from the OshAds server (server/index.ts):
 * public visitors get live apps only, signed-in staff get everything. Writes go through `save`,
 * which the server checks against the user's role before anything changes locally.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message)
  }
}

interface Db {
  apps: MobileApp[]
  campaigns: Campaign[]
  clients: Client[]
  notifications: AppNotification[]
  reports: SavedReport[]
}
type Kind = keyof Db

export const db: Db = { apps: [], campaigns: [], clients: [], notifications: [], reports: [] }

// Queries made before the first load wait for it; later ones wait for the latest reload.
let markLoaded: () => void
let ready: Promise<unknown> = new Promise<void>((r) => (markLoaded = r))

async function errorFrom(res: Response, fallback: string) {
  const body = (await res.json().catch(() => null)) as { error?: string } | null
  return new ApiError(body?.error ?? fallback, res.status)
}

// Set when the last load failed, so the next request retries instead of serving an empty catalogue.
let failedScope: 'staff' | 'public' | null = null

/** (Re)loads the local copy: 'staff' needs a valid session cookie, 'public' works for anyone. */
export function loadDb(scope: 'staff' | 'public') {
  const load = (async () => {
    const res = await fetch(scope === 'staff' ? '/api/db' : '/api/public')
    if (!res.ok) throw await errorFrom(res, 'Couldn’t load data from the server. Refresh to try again.')
    Object.assign(db, { apps: [], campaigns: [], clients: [], notifications: [], reports: [] }, await res.json())
  })()
  ready = load.then(
    () => (failedScope = null),
    () => (failedScope = scope),
  )
  load.then(markLoaded, markLoaded)
  return load
}

export async function request<T>(resolver: () => T | undefined | null, opts: { latency?: [number, number] } = {}): Promise<T> {
  await ready
  if (failedScope) await loadDb(failedScope) // throws the server error if it is still down
  if (opts.latency) await new Promise((r) => setTimeout(r, opts.latency![0]))
  if (!navigator.onLine) throw new ApiError('You appear to be offline. Check your connection and try again.', 0)
  const result = resolver()
  if (result === undefined || result === null) throw new ApiError('Not found', 404)
  return structuredClone(result) as T
}

/** Saves a document on the server, then updates the local copy. `create` refuses to overwrite an existing id. */
export async function save<K extends Kind>(kind: K, doc: Db[K][number], opts: { create?: boolean } = {}): Promise<Db[K][number]> {
  await ready
  const res = await fetch(`/api/docs/${kind}/${encodeURIComponent(doc.id)}${opts.create ? '?create=1' : ''}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  })
  if (!res.ok) throw await errorFrom(res, 'Couldn’t save your change. Try again.')
  const list = db[kind] as Array<Db[K][number]>
  const i = list.findIndex((x) => x.id === doc.id)
  if (i >= 0) list[i] = doc
  else list.unshift(doc)
  return structuredClone(doc)
}

/** Finds a document in the local copy or fails with a 404. */
export async function find<K extends Kind>(kind: K, id: string): Promise<Db[K][number]> {
  await ready
  const doc = (db[kind] as Array<Db[K][number]>).find((x) => x.id === id)
  if (!doc) throw new ApiError('Not found', 404)
  return doc
}

/** Reloads the starter catalogue on the server for everyone (admins only). */
export async function resetDemoData() {
  const res = await fetch('/api/admin/reset', { method: 'POST' })
  if (!res.ok) throw await errorFrom(res, 'Couldn’t reset the data.')
  location.reload()
}

export const newId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`
