import { useCallback, useEffect, useReducer, useRef } from 'react'
import { queryClient } from '@/services/queryClient'

export interface QueryResult<T> {
  data: T | undefined
  error: Error | undefined
  loading: boolean
  /** True only for the first load (no cached data yet). */
  initialLoading: boolean
  refetch: () => void
}

/**
 * Cached async data hook. `key` identifies the request; pass `null` to skip.
 * Keys are hierarchical strings (e.g. `campaigns:list:active`) so mutations can
 * invalidate a whole family with `queryClient.invalidate('campaigns')`.
 */
export function useQuery<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  opts: { keepPrevious?: boolean } = {},
): QueryResult<T> {
  const [, force] = useReducer((x: number) => x + 1, 0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    if (!key) return
    const unsub = queryClient.subscribe(key, () => {
      const entry = queryClient.get(key)
      if (entry?.stale && !entry.promise) queryClient.fetch(key, fetcherRef.current, true).catch(() => {})
      force()
    })
    queryClient.fetch(key, fetcherRef.current).catch(() => {})
    force()
    return unsub
  }, [key])

  const refetch = useCallback(() => {
    if (key) queryClient.fetch(key, fetcherRef.current, true).catch(() => {})
  }, [key])

  const entry = key ? queryClient.get<T>(key) : undefined
  const last = useRef<T | undefined>(undefined)
  if (entry?.data !== undefined) last.current = entry.data
  const data = entry?.data ?? (opts.keepPrevious ? last.current : undefined)
  return {
    data,
    error: entry?.error,
    loading: !!entry?.promise,
    initialLoading: !!key && data === undefined && !entry?.error,
    refetch,
  }
}
