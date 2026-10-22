import { motion } from 'framer-motion'
import { Fragment, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface RevealLine {
  text: string
  className?: string
}

/**
 * Masked word-by-word reveal. Each word rises from behind its own clipping box.
 * The full sentence stays in the DOM as plain text, so screen readers read it once, normally.
 */
export function SplitReveal({
  lines,
  as: Tag = 'h2',
  className,
  delay = 0,
  stagger = 0.06,
  onView = true,
  id,
}: {
  lines: Array<RevealLine | string>
  as?: 'h1' | 'h2' | 'h3' | 'p'
  className?: string
  delay?: number
  stagger?: number
  onView?: boolean
  id?: string
}) {
  const normalized = lines.map((l) => (typeof l === 'string' ? { text: l } : l))
  const label = normalized.map((l) => l.text).join(' ')
  let i = 0
  const trigger = onView
    ? { initial: 'hidden' as const, whileInView: 'show' as const, viewport: { once: true, margin: '-12% 0px' } }
    : { initial: 'hidden' as const, animate: 'show' as const }
  const MotionTag = motion[Tag]
  return (
    <MotionTag id={id} aria-label={label} className={className} {...trigger}>
      {normalized.map((line, li) => (
        <Fragment key={li}>
          <span className="block" aria-hidden>
            {line.text.split(' ').map((word, wi) => {
              const idx = i++
              return (
                <span key={wi} className="inline-block overflow-hidden pb-[0.12em] align-bottom [margin-bottom:-0.12em]">
                  <motion.span
                    // Styles (e.g. gradient text) go on the word itself: background-clip:text can't paint through transformed children.
                    className={cn('inline-block will-change-transform', line.className)}
                    variants={{
                      // No opacity fade: the clip mask hides the word, so text is painted from frame one (keeps LCP fast).
                      hidden: { y: '110%', rotate: 4 },
                      show: { y: '0%', rotate: 0, transition: { duration: 0.9, delay: delay + idx * stagger, ease: [0.16, 1, 0.3, 1] } },
                    }}
                  >
                    {word}
                  </motion.span>
                  {' '}
                </span>
              )
            })}
          </span>
        </Fragment>
      ))}
    </MotionTag>
  )
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn('mb-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-subtle', className)}
    >
      <span className="h-px w-8 bg-gradient-to-r from-[#1B3FD0] to-[#3D7BFF]" aria-hidden />
      {children}
    </motion.p>
  )
}
