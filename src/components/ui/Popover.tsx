import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'

function useDismiss(open: boolean, close: () => void, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close, ref])
}

export function Popover({
  trigger,
  children,
  align = 'end',
  className,
  panelClassName,
}: {
  trigger: (props: { open: boolean; toggle: () => void; id: string }) => ReactNode
  children: ReactNode | ((close: () => void) => ReactNode)
  align?: 'start' | 'end'
  className?: string
  panelClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, close, ref)
  return (
    <div ref={ref} className={cn('relative', className)}>
      {trigger({ open, toggle: () => setOpen((o) => !o), id })}
      <AnimatePresence>
        {open && (
          <motion.div
            id={id}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'absolute top-full z-50 mt-2 origin-top rounded-xl glass-strong p-1 shadow-lg',
              align === 'end' ? 'right-0' : 'left-0',
              panelClassName,
            )}
          >
            {typeof children === 'function' ? children(close) : children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export interface MenuItem {
  label: string
  icon?: ReactNode
  onSelect?: () => void
  href?: string
  danger?: boolean
  disabled?: boolean
  hidden?: boolean
  separatorBefore?: boolean
}

/** Accessible action menu with arrow-key navigation. */
export function Menu({
  items,
  trigger,
  align = 'end',
  label,
}: {
  items: MenuItem[]
  trigger: (props: { open: boolean; toggle: () => void; id: string }) => ReactNode
  align?: 'start' | 'end'
  label: string
}) {
  const navigate = useNavigate()
  const visible = items.filter((i) => !i.hidden)
  return (
    <Popover trigger={trigger} align={align} panelClassName="min-w-48">
      {(close) => (
        <div
          role="menu"
          aria-label={label}
          onKeyDown={(e) => {
            const els = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role=menuitem]:not([disabled])'))
            const idx = els.indexOf(document.activeElement as HTMLButtonElement)
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              els[(idx + 1) % els.length]?.focus()
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              els[(idx - 1 + els.length) % els.length]?.focus()
            }
          }}
          ref={(el) => {
            el?.querySelector<HTMLButtonElement>('[role=menuitem]:not([disabled])')?.focus()
          }}
        >
          {visible.map((item) => (
            <div key={item.label}>
              {item.separatorBefore && <div className="my-1 h-px bg-line" role="separator" />}
              <button
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  close()
                  if (item.href) navigate(item.href)
                  item.onSelect?.()
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors disabled:opacity-40 [&>svg]:size-4',
                  item.danger
                    ? 'text-danger hover:bg-danger-soft focus:bg-danger-soft'
                    : 'text-fg hover:bg-surface-2 focus:bg-surface-2',
                )}
              >
                {item.icon}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </Popover>
  )
}

export function Tooltip({ content, children, side = 'top' }: { content: ReactNode; children: ReactNode; side?: 'top' | 'bottom' | 'right' }) {
  const pos = {
    top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
    bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
    right: 'left-full top-1/2 ml-2 -translate-y-1/2',
  }[side]
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity delay-0 duration-150 group-hover/tt:opacity-100 group-hover/tt:delay-300 group-focus-within/tt:opacity-100 dark:bg-ink-700',
          pos,
        )}
      >
        {content}
      </span>
    </span>
  )
}
