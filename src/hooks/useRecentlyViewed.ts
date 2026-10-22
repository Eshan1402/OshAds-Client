import { useCallback, useSyncExternalStore } from 'react'

const KEY = 'adwin:recently-viewed'
const MAX = 8
const listeners = new Set<() => void>()
let cache: string[] | null = null

function read(): string[] {
  if (cache) return cache
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]
  } catch {
    cache = []
  }
  return cache
}

function write(ids: string[]) {
  cache = ids
  try {
    localStorage.setItem(KEY, JSON.stringify(ids))
  } catch {
    /* storage unavailable: keep in memory for this session */
  }
  listeners.forEach((l) => l())
}

/** Records an app view — most recent first, de-duplicated, capped. Stored only on this device. */
export function recordAppView(appId: string) {
  write([appId, ...read().filter((id) => id !== appId)].slice(0, MAX))
}

export function useRecentlyViewed() {
  const ids = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    read,
    () => [],
  )
  const clear = useCallback(() => write([]), [])
  return { ids, clear }
}
