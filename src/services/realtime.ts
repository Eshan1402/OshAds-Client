/**
 * Realtime channel. Live visitors are polled from the server (visitors active in the last 5 minutes);
 * consumers only depend on `subscribe(topic, handler)`, so a WebSocket can replace the polling later.
 */
type Handler<T> = (payload: T) => void

export interface RealtimeEvents {
  'visitors:live': number
  'notification:new': import('@/types').AppNotification
  'app:click': { appId: string; store: 'ios' | 'android' | 'web' }
}

const handlers = new Map<keyof RealtimeEvents, Set<Handler<never>>>()

export function publish<K extends keyof RealtimeEvents>(topic: K, payload: RealtimeEvents[K]) {
  handlers.get(topic)?.forEach((h) => (h as Handler<RealtimeEvents[K]>)(payload))
}

export function subscribe<K extends keyof RealtimeEvents>(topic: K, handler: Handler<RealtimeEvents[K]>) {
  let set = handlers.get(topic)
  if (!set) handlers.set(topic, (set = new Set()))
  set.add(handler as Handler<never>)
  if (topic === 'visitors:live') ensurePolling()
  return () => {
    set!.delete(handler as Handler<never>)
  }
}

let started = false
let live = 0
function ensurePolling() {
  if (started) return
  started = true
  const poll = () =>
    fetch('/api/live')
      .then((r) => (r.ok ? r.json() : null))
      .then((b: { visitors: number } | null) => {
        if (!b) return
        live = b.visitors
        publish('visitors:live', live)
      })
      .catch(() => {})
  poll()
  setInterval(poll, 10_000)
}

export const getLiveVisitors = () => live
