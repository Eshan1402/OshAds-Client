import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useMediaQuery, usePrefersReducedMotion } from '@/hooks/useMediaQuery'

type Mode = 'default' | 'link' | 'label' | 'text' | 'hidden'

const INTERACTIVE = 'a,button,[role=button],[role=tab],[role=radio],[role=switch],[role=menuitem],select,summary,label[for]'
const TEXT = 'input:not([type=checkbox]):not([type=radio]):not([type=range]),textarea,[contenteditable=true]'

/**
 * Branded cursor: a precise dot plus a spring-lagged ring that reacts to what's underneath.
 *  - links/buttons → ring expands with the brand gradient
 *  - [data-cursor="Label"] → ring becomes a labelled pill ("View", "Scroll", …)
 *  - text fields → custom cursor hides so the native I-beam stays usable
 * Only mounts for fine pointers with motion allowed; everyone else keeps the system cursor.
 */
export function CustomCursor() {
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)')
  const reduced = usePrefersReducedMotion()
  return fine && !reduced ? <Cursor /> : null
}

function Cursor() {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 380, damping: 32, mass: 0.6 })
  const ringY = useSpring(y, { stiffness: 380, damping: 32, mass: 0.6 })
  const [mode, setMode] = useState<Mode>('hidden')
  const [label, setLabel] = useState('')
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add('has-custom-cursor')

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      x.set(e.clientX)
      y.set(e.clientY)
      const t = e.target as Element | null
      const labelled = t?.closest<HTMLElement>('[data-cursor]')
      if (t?.closest(TEXT)) setMode('text')
      else if (labelled) {
        setLabel(labelled.dataset.cursor ?? '')
        setMode('label')
      } else if (t?.closest(INTERACTIVE)) setMode('link')
      else setMode('default')
    }
    const onLeave = () => setMode('hidden')
    const onDown = () => setPressed(true)
    const onUp = () => setPressed(false)

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('blur', onLeave)
    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('blur', onLeave)
    }
  }, [x, y])

  const ring = {
    default: { width: 34, height: 34, opacity: 1 },
    link: { width: 58, height: 58, opacity: 1 },
    label: { width: 84, height: 84, opacity: 1 },
    text: { width: 34, height: 34, opacity: 0 },
    hidden: { width: 34, height: 34, opacity: 0 },
  }[mode]

  return (
    <div className="pointer-events-none fixed inset-0 z-[200]" aria-hidden>
      {/* Trailing ring */}
      <motion.div className="absolute left-0 top-0" style={{ x: ringX, y: ringY }}>
        <motion.div
          className="grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
          animate={{ ...ring, scale: pressed ? 0.82 : 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          style={{
            background:
              mode === 'label'
                ? 'linear-gradient(135deg,#1B3FD0,#2C5BEF 45%,#3D7BFF 75%,#7CC4FF)'
                : mode === 'link'
                  ? 'linear-gradient(135deg,rgb(27 63 208/0.22),rgb(61 123 255/0.22))'
                  : 'transparent',
            boxShadow:
              mode === 'label'
                ? '0 10px 30px -8px rgb(61 123 255 / 0.55)'
                : mode === 'link'
                  ? 'inset 0 0 0 1.5px rgb(61 123 255 / 0.9)'
                  : 'inset 0 0 0 1.5px var(--line-strong)',
            backdropFilter: mode === 'link' ? 'blur(2px)' : undefined,
          }}
        >
          <AnimatePresence>
            {mode === 'label' && (
              <motion.span
                key={label}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.18 }}
                className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-white"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Precise dot — the true pointer position, inverted against any background */}
      <motion.div className="absolute left-0 top-0 mix-blend-difference" style={{ x, y }}>
        <motion.div
          className="-translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
          animate={{
            width: mode === 'label' ? 0 : mode === 'link' ? 6 : 8,
            height: mode === 'label' ? 0 : mode === 'link' ? 6 : 8,
            opacity: mode === 'hidden' || mode === 'text' ? 0 : 1,
            scale: pressed ? 0.6 : 1,
          }}
          transition={{ type: 'spring', stiffness: 700, damping: 35 }}
        />
      </motion.div>
    </div>
  )
}
