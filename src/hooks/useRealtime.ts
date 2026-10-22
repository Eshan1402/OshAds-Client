import { useEffect, useState } from 'react'
import { getLiveVisitors, subscribe } from '@/services/realtime'

export function useLiveVisitors() {
  const [value, setValue] = useState(getLiveVisitors)
  useEffect(() => subscribe('visitors:live', setValue), [])
  return value
}
