type Listener = () => void

interface Entry<T = unknown> {
  data?: T
  error?: Error
  promise?: Promise<T>
  updatedAt: number
  stale: boolean
}

/** Minimal query cache: dedupes requests, shares results, supports invalidation. */
class QueryClient {
  private entries = new Map<string, Entry>()
  private listeners = new Map<string, Set<Listener>>()

  get<T>(key: string) {
    return this.entries.get(key) as Entry<T> | undefined
  }

  fetch<T>(key: string, fetcher: () => Promise<T>, force = false): Promise<T> {
    const existing = this.entries.get(key) as Entry<T> | undefined
    if (existing?.promise) return existing.promise
    if (!force && existing?.data !== undefined && !existing.stale) return Promise.resolve(existing.data)
    const entry: Entry<T> = { ...(existing ?? { updatedAt: 0, stale: false }) }
    const promise = fetcher()
      .then((data) => {
        this.entries.set(key, { data, updatedAt: Date.now(), stale: false })
        return data
      })
      .catch((error: Error) => {
        this.entries.set(key, { ...entry, promise: undefined, error, stale: false })
        throw error
      })
      .finally(() => this.emit(key))
    entry.promise = promise
    entry.error = undefined
    this.entries.set(key, entry as Entry)
    this.emit(key)
    return promise
  }

  setData<T>(key: string, updater: (prev: T | undefined) => T) {
    const prev = this.entries.get(key) as Entry<T> | undefined
    this.entries.set(key, { data: updater(prev?.data), updatedAt: Date.now(), stale: false })
    this.emit(key)
  }

  /** Mark every key starting with `prefix` stale and notify subscribers to refetch. */
  invalidate(prefix: string) {
    for (const [key, entry] of this.entries) {
      if (key.startsWith(prefix)) {
        entry.stale = true
        this.emit(key)
      }
    }
  }

  subscribe(key: string, fn: Listener) {
    let set = this.listeners.get(key)
    if (!set) this.listeners.set(key, (set = new Set()))
    set.add(fn)
    return () => {
      set!.delete(fn)
    }
  }

  private emit(key: string) {
    this.listeners.get(key)?.forEach((fn) => fn())
  }
}

export const queryClient = new QueryClient()
