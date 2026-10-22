import { Check, ChevronDown } from 'lucide-react'
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/utils/cn'

const control =
  'w-full rounded-[10px] border border-line-strong bg-surface text-sm text-fg shadow-xs placeholder:text-subtle transition-[border-color,box-shadow] duration-150 hover:border-subtle focus:border-accent focus:shadow-[var(--ring)] focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-70 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:shadow-[0_0_0_3px_rgb(240_68_56/0.2)]'

interface FieldProps {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  required?: boolean
  className?: string
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode
}

/** Wires label, hint and error text to a control with correct ARIA attributes. */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errId = error ? `${id}-err` : undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-[13px] font-medium text-fg">
          {label}
          {required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
        </label>
      )}
      {children({ id, describedBy: [hintId, errId].filter(Boolean).join(' ') || undefined, invalid: !!error })}
      {error ? (
        <p id={errId} className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-xs text-subtle">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode
  rightSlot?: ReactNode
  invalid?: boolean
  inputSize?: 'sm' | 'md' | 'lg'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leftIcon, rightSlot, invalid, inputSize = 'md', ...rest },
  ref,
) {
  const h = { sm: 'h-10 text-[13px] sm:h-8', md: 'h-10', lg: 'h-12 text-[15px]' }[inputSize]
  return (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle [&>svg]:size-4">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(control, h, leftIcon ? 'pl-9' : 'pl-3', rightSlot ? 'pr-10' : 'pr-3', className)}
        {...rest}
      />
      {rightSlot && <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{rightSlot}</span>}
    </div>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(control, 'min-h-24 resize-y px-3 py-2.5 leading-relaxed', className)}
        {...rest}
      />
    )
  },
)

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean; selectSize?: 'sm' | 'md' }
>(function Select({ className, invalid, selectSize = 'md', children, ...rest }, ref) {
  return (
    <div className={cn('relative', className)}>
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(control, 'appearance-none pl-3 pr-9', selectSize === 'sm' ? 'h-10 text-[13px] sm:h-8' : 'h-10')}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
    </div>
  )
})

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  id,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: ReactNode
  description?: ReactNode
  id?: string
  disabled?: boolean
}) {
  const auto = useId()
  const cid = id ?? auto
  return (
    <label htmlFor={cid} className={cn('group flex cursor-pointer items-start gap-2.5', disabled && 'cursor-not-allowed opacity-60')}>
      <span className="relative mt-0.5 flex">
        <input
          id={cid}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={cn(
            'grid size-[18px] place-items-center rounded-[5px] border transition-all duration-150 peer-focus-visible:shadow-[var(--ring)]',
            checked ? 'border-accent bg-accent text-white' : 'border-line-strong bg-surface group-hover:border-subtle',
          )}
        >
          <Check className={cn('size-3 transition-transform', checked ? 'scale-100' : 'scale-0')} strokeWidth={3} aria-hidden />
        </span>
      </span>
      {(label || description) && (
        <span className="flex flex-col">
          {label && <span className="text-sm font-medium text-fg">{label}</span>}
          {description && <span className="text-xs text-subtle">{description}</span>}
        </span>
      )}
    </label>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
        {description && <span className="text-[13px] text-subtle">{description}</span>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-200',
          checked ? 'bg-accent' : 'bg-surface-3',
        )}
      >
        <span
          className={cn(
            'inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-[var(--ease-spring)]',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}
