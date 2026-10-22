import { useSyncExternalStore } from 'react'

let open = false
const listeners = new Set<() => void>()

export const searchStore = {
  open: () => set(true),
  close: () => set(false),
  toggle: () => set(!open),
}

function set(v: boolean) {
  open = v
  listeners.forEach((l) => l())
}

export function useSearchOpen() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => open,
  )
}
