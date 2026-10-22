import { Loader2 } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'inverse'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const base =
  'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:shadow-[var(--ring)]'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white shadow-[0_1px_0_0_rgb(255_255_255/0.18)_inset,0_1px_2px_rgb(232_80_10/0.4)] hover:bg-accent-hover',
  secondary: 'bg-fg text-bg hover:opacity-90',
  outline: 'border border-line-strong bg-surface text-fg shadow-xs hover:border-subtle hover:bg-surface-2',
  ghost: 'text-muted hover:bg-surface-2 hover:text-fg',
  danger: 'bg-danger text-white hover:opacity-90',
  inverse: 'bg-white text-ink-950 hover:bg-ink-100',
}

const sizes: Record<ButtonSize, string> = {
  xs: 'h-9 rounded-md px-2.5 text-xs sm:h-7',
  sm: 'h-10 rounded-lg px-3 text-[13px] sm:h-8',
  md: 'h-10 rounded-[10px] px-4 text-sm',
  lg: 'h-12 rounded-xl px-5 text-[15px]',
  xl: 'h-14 rounded-2xl px-7 text-base',
}

const iconSizes: Record<ButtonSize, string> = {
  xs: 'size-9 rounded-md sm:size-7',
  sm: 'size-10 rounded-lg sm:size-8',
  md: 'size-10 rounded-[10px]',
  lg: 'size-12 rounded-xl',
  xl: 'size-14 rounded-2xl',
}

interface StyleProps {
  variant?: ButtonVariant
  size?: ButtonSize
  iconOnly?: boolean
  className?: string
}

export const buttonClass = ({ variant = 'primary', size = 'md', iconOnly, className }: StyleProps) =>
  cn(base, variants[variant], iconOnly ? iconSizes[size] : sizes[size], className)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, StyleProps {
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, iconOnly, className, loading, leftIcon, rightIcon, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, iconOnly, className })}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
})

export function ButtonLink({
  variant,
  size,
  iconOnly,
  className,
  leftIcon,
  rightIcon,
  children,
  ...rest
}: LinkProps & StyleProps & { leftIcon?: ReactNode; rightIcon?: ReactNode }) {
  return (
    <Link className={buttonClass({ variant, size, iconOnly, className })} {...rest}>
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  )
}
