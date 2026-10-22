import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register once; every consumer imports from here so plugins are guaranteed present.
gsap.registerPlugin(ScrollTrigger, useGSAP)

// Page height changes after load (async data, pinned sections sizing themselves), which
// would leave ScrollTrigger start positions stale. Re-measure, debounced, whenever it does.
if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
  let t: number | undefined
  let lastHeight = 0
  new ResizeObserver(() => {
    const h = document.documentElement.scrollHeight
    if (Math.abs(h - lastHeight) < 2) return
    lastHeight = h
    window.clearTimeout(t)
    t = window.setTimeout(() => ScrollTrigger.refresh(), 150)
  }).observe(document.body)
}

/** Motion tokens shared by GSAP effects (mirrors the CSS --ease-out-expo curve). */
export const motionTokens = {
  ease: 'expo.out',
  revealY: 16,
  revealDuration: 0.7,
  stagger: 0.06,
} as const

export const REDUCED = '(prefers-reduced-motion: reduce)'
export const ALLOW_MOTION = '(prefers-reduced-motion: no-preference)'

export { gsap, ScrollTrigger, useGSAP }
