import { cn } from '@/utils/cn'

/**
 * OshAds mark — the logo's "O": a heavy royal-blue ring around a solid dot.
 * Vector redraw of the brand logo so it stays crisp at any size, on light and dark.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn('size-8 shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <circle cx="32" cy="32" r="23.5" fill="none" strokeWidth="13" style={{ stroke: 'var(--logo)' }} />
      <circle cx="32" cy="32" r="8.5" style={{ fill: 'var(--logo)' }} />
    </svg>
  )
}

/**
 * Wordmark: ring "O" + "shAds". The A's crossbar band is painted blue, echoing the
 * blue slash through the A in the logo. Optional "Driven by results" tagline.
 */
export function Logo({ className, compact, tagline }: { className?: string; compact?: boolean; tagline?: boolean }) {
  if (compact) return <LogoMark className={cn('size-9', className)} title="OshAds" />
  return (
    <span className={cn('inline-flex flex-col', className)} aria-label="OshAds">
      <span className="inline-flex items-center gap-[2px] leading-none" aria-hidden>
        <LogoMark className="size-[30px]" />
        <span className="font-display text-[26px] font-extrabold tracking-[-0.04em] text-fg">
          sh
          <span
            className="bg-clip-text text-transparent [-webkit-background-clip:text]"
            style={{ backgroundImage: 'linear-gradient(to bottom, var(--fg) 0%, var(--fg) 54%, var(--logo) 54%, var(--logo) 70%, var(--fg) 70%)' }}
          >
            A
          </span>
          ds
        </span>
      </span>
      {tagline && <span className="mt-1 pl-[34px] font-mono text-[10px] font-medium tracking-[0.08em] text-muted">Driven by results</span>}
    </span>
  )
}
