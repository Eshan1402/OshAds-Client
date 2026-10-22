import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MobileApp } from '@/types'
import { cn } from '@/utils/cn'
import { useFocusTrap } from '@/components/ui/Modal'
import { AppScreen, PhoneFrame } from './AppScreen'

/** Store-style screenshot rail with captions, scroll controls and a keyboard-friendly lightbox. */
export function ScreenshotGallery({ app }: { app: MobileApp }) {
  const rail = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<number | null>(null)
  const images = app.screenshotImages ?? []
  const shots = Array.from({ length: images.length || app.screenshots }, (_, i) => i)

  const scroll = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: 'smooth' })

  return (
    <div className="relative">
      <div className="mb-4 flex items-center justify-end gap-1">
        <button onClick={() => scroll(-1)} className="grid size-9 place-items-center rounded-full glass text-muted transition hover:text-fg" aria-label="Scroll screenshots left">
          <ChevronLeft className="size-4" />
        </button>
        <button onClick={() => scroll(1)} className="grid size-9 place-items-center rounded-full glass text-muted transition hover:text-fg" aria-label="Scroll screenshots right">
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div ref={rail} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 scrollbar-none sm:mx-0 sm:px-0">
        {shots.map((i) => {
          const feature = app.features[i % app.features.length]
          return (
            <button
              key={i}
              onClick={() => setOpen(i)}
              data-cursor="Zoom"
              className="group relative w-[200px] shrink-0 snap-start overflow-hidden rounded-[24px] p-4 pb-0 text-left sm:w-[220px]"
              style={{ background: `linear-gradient(165deg, ${app.colors[0]}, ${app.colors[1]})` }}
              aria-label={`Open screenshot ${i + 1}: ${feature.title}`}
            >
              <p className="font-display text-[15px] font-bold leading-snug text-white">{feature.title}</p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-white/80">{feature.description}</p>
              <div className="mx-auto mt-4 w-[86%] translate-y-6 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-y-3">
                <PhoneFrame>
                  {images[i] ? <img src={images[i]} alt="" className="h-full w-full object-cover" /> : <AppScreen app={app} variant={i} />}
                </PhoneFrame>
              </div>
            </button>
          )
        })}
      </div>
      <Lightbox app={app} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </div>
  )
}

function Lightbox({ app, index, onClose, onIndex }: { app: MobileApp; index: number | null; onClose: () => void; onIndex: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const open = index !== null
  const count = app.screenshotImages?.length || app.screenshots
  useFocusTrap(open, ref, onClose)
  const go = useCallback(
    (d: number) => index !== null && onIndex((index + d + count) % count),
    [index, onIndex, count],
  )
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, go])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={`${app.name} screenshots`}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink-950/90 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button onClick={onClose} className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close">
            <X className="size-5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); go(-1) }} className="absolute left-2 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-8" aria-label="Previous screenshot">
            <ChevronLeft className="size-5" />
          </button>
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="w-[min(320px,72vw)]"
            onClick={(e) => e.stopPropagation()}
          >
            <PhoneFrame>
              {app.screenshotImages?.[index!] ? <img src={app.screenshotImages[index!]} alt={`Screenshot ${index! + 1}`} className="h-full w-full object-cover" /> : <AppScreen app={app} variant={index!} />}
            </PhoneFrame>
            <p className="mt-4 text-center text-sm font-medium text-white/80">
              {app.features[index! % app.features.length].title} · {index! + 1} / {count}
            </p>
          </motion.div>
          <button onClick={(e) => { e.stopPropagation(); go(1) }} className="absolute right-2 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-8" aria-label="Next screenshot">
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-6 flex gap-1.5">
            {Array.from({ length: count }).map((_, i) => (
              <span key={i} className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40')} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
