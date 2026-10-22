import type { AppNotification } from '@/types'
import { db, request } from './api'
import { publish } from './realtime'

// Real alerts arrive once the server pushes events; nothing is simulated.
const incoming: Array<Omit<AppNotification, 'id' | 'createdAt' | 'read'>> = []

let cursor = 0
let timer: number | undefined

export const notificationsService = {
  list() {
    return request(() => [...db.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), { latency: [120, 300] })
  },
  markRead(id: string) {
    return request(() => {
      const n = db.notifications.find((x) => x.id === id)
      if (n) n.read = true
      return true
    }, { latency: [60, 120] })
  },
  markAllRead() {
    return request(() => {
      db.notifications.forEach((n) => (n.read = true))
      return true
    }, { latency: [60, 120] })
  },
  /** Starts the simulated push stream (a WebSocket subscription in production). */
  startStream() {
    if (timer || cursor >= incoming.length) return
    timer = window.setInterval(() => {
      const next = incoming[cursor++]
      if (!next) return window.clearInterval(timer)
      const n: AppNotification = { ...next, id: `live_${cursor}`, createdAt: new Date().toISOString(), read: false }
      db.notifications.unshift(n)
      publish('notification:new', n)
    }, 75_000)
  },
}
