import type { PointerEvent } from 'react'

/** Writes pointer position into CSS vars so a radial "spotlight" can follow the cursor without re-rendering. */
export function trackSpotlight(e: PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
}

export const spotlightClass =
  'pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 [background:radial-gradient(380px_circle_at_var(--mx,50%)_var(--my,50%),rgb(123_75_234/0.10),rgb(242_86_104/0.05)_40%,transparent_70%)]'
