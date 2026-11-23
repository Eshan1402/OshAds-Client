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

/** The OshAds logo image with its tagline; a light-text copy shows in dark mode. */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  if (compact) return <LogoMark className={cn('size-9', className)} title="OshAds" />
  return (
    <span className={cn('inline-flex h-10 shrink-0', className)}>
      <img src="/brand/oshads-logo.png" alt="OshAds — Driven by results" className="h-full w-auto dark:hidden" />
      <img src="/brand/oshads-logo-dark.png" alt="OshAds — Driven by results" className="hidden h-full w-auto dark:block" />
    </span>
  )
}
