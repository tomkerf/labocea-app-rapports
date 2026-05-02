import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Field({
  label,
  hint,
  error,
  children,
  className,
  required,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
  className?: string
  required?: boolean
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-xs md:text-xs font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <span className="text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="text-xs text-slate-500">{hint}</span>
      ) : null}
    </div>
  )
}

// Inputs : padding plus grand sur mobile (py-3) pour offrir une zone tactile ≥ 44px,
// padding plus serré sur desktop (md:py-2). Hauteur min imposée pour iOS.
const baseInput =
  'w-full min-h-[44px] md:min-h-0 px-3 py-3 md:py-2 border border-slate-200 rounded-md bg-white text-base md:text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-500'

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      autoComplete={props.autoComplete ?? 'off'}
      autoCorrect={props.autoCorrect ?? 'off'}
      autoCapitalize={props.autoCapitalize ?? 'none'}
      spellCheck={props.spellCheck ?? false}
      enterKeyHint={props.enterKeyHint ?? 'next'}
      {...props}
      className={cn(baseInput, props.className)}
    />
  )
}

export function NumberInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      type="number"
      step="any"
      inputMode="decimal"
      enterKeyHint={props.enterKeyHint ?? 'next'}
      autoComplete="off"
      {...props}
      className={cn(baseInput, props.className)}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(baseInput, 'pr-9', props.className)} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      autoComplete={props.autoComplete ?? 'off'}
      autoCorrect={props.autoCorrect ?? 'on'}
      autoCapitalize={props.autoCapitalize ?? 'sentences'}
      enterKeyHint={props.enterKeyHint ?? 'enter'}
      {...props}
      className={cn(baseInput, 'min-h-[96px] py-2.5', props.className)}
    />
  )
}
