/**
 * Fixed-window request limits per key (usually the client IP), kept in memory.
 * shortcut: counts reset on restart and aren't shared between processes; move to Redis if you run more than one instance.
 */
export function limiter(max: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>()
  return (key: string) => {
    const now = Date.now()
    if (hits.size > 50_000) for (const [k, h] of hits) if (h.resetAt < now) hits.delete(k) // keep memory bounded
    const h = hits.get(key)
    if (!h || h.resetAt < now) {
      hits.set(key, { count: 1, resetAt: now + windowMs })
      return false
    }
    return ++h.count > max
  }
}
