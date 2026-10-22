import { memo } from 'react'
import type { MobileApp } from '@/types'
import { cn } from '@/utils/cn'
import { DynamicIcon } from './DynamicIcon'

const sizes = {
  xs: { box: 'size-7 rounded-[8px]', icon: 'size-3.5' },
  sm: { box: 'size-9 rounded-[10px]', icon: 'size-4' },
  md: { box: 'size-12 rounded-[14px]', icon: 'size-5' },
  lg: { box: 'size-16 rounded-[18px]', icon: 'size-7' },
  xl: { box: 'size-24 rounded-[26px]', icon: 'size-10' },
}

/** App icon: the uploaded logo, or a theme-coloured squircle with the app's glyph. */
export const AppIcon = memo(function AppIcon({
  app,
  size = 'md',
  className,
}: {
  app: Pick<MobileApp, 'name' | 'icon' | 'colors' | 'iconImage'>
  size?: keyof typeof sizes
  className?: string
}) {
  const s = sizes[size]
  if (app.iconImage) {
    // White backing so transparent logos stay visible in dark mode.
    return <img src={app.iconImage} alt="" className={cn(s.box, 'shrink-0 bg-white object-cover shadow-sm', className)} />
  }
  return (
    <span
      className={cn(s.box, 'relative grid shrink-0 place-items-center overflow-hidden bg-surface-2 text-fg shadow-sm ring-1 ring-line', className)}
      aria-hidden
    >
      <DynamicIcon name={app.icon} className={s.icon} strokeWidth={2.2} />
    </span>
  )
})
