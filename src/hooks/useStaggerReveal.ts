import type { RefObject } from 'react'
import { ALLOW_MOTION, gsap, motionTokens, ScrollTrigger, useGSAP } from '@/lib/gsap'

/**
 * Coordinated scroll reveal for a group of items (cards, tiles, columns).
 * ScrollTrigger.batch groups items entering together into one stagger, so a row reads
 * as a single gesture. Items start hidden only when motion is allowed and JS has run —
 * with reduced motion (or no JS) everything is simply visible.
 */
export function useStaggerReveal(scope: RefObject<HTMLElement | null>, selector = '[data-reveal]', deps: unknown[] = []) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(ALLOW_MOTION, () => {
        const items = gsap.utils.toArray<HTMLElement>(selector, scope.current)
        if (!items.length) return
        gsap.set(items, { autoAlpha: 0, y: motionTokens.revealY })
        const triggers = ScrollTrigger.batch(items, {
          start: 'top 92%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: motionTokens.revealDuration,
              ease: motionTokens.ease,
              stagger: motionTokens.stagger,
              overwrite: true,
              clearProps: 'transform',
            }),
        })
        return () => triggers.forEach((t) => t.kill())
      })
      return () => mm.revert()
    },
    { scope, dependencies: deps, revertOnUpdate: true },
  )
}
