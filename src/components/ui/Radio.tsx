import { cn } from '../../lib/cn'

export type RadioOption<T extends string> = { value: T; label: string }

export function RadioGroup<T extends string>({
  value,
  onChange,
  options,
  name,
  vertical = false,
}: {
  value: T | undefined
  onChange: (v: T) => void
  options: RadioOption<T>[]
  name: string
  /** Force l'affichage en colonne (utile pour 4+ options ou labels longs) */
  vertical?: boolean
}) {
  return (
    <div className={cn(
      'flex gap-2',
      vertical ? 'flex-col' : 'flex-wrap',
    )}>
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <label
            key={opt.value}
            className={cn(
              'cursor-pointer select-none inline-flex items-center min-h-[44px] rounded-lg border-2 text-sm font-medium transition active:scale-[0.97]',
              vertical ? 'px-4 py-2.5 w-full' : 'justify-center px-4 py-2.5',
              active
                ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={active}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {active && (
              <span className="mr-2 w-4 h-4 rounded-full border-2 border-brand-500 flex items-center justify-center shrink-0">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
              </span>
            )}
            {opt.label}
          </label>
        )
      })}
    </div>
  )
}

export function CheckboxRow({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean | undefined
  onChange: (v: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none py-2.5 min-h-[44px]">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-5 h-5 accent-brand-600"
      />
      <span className="text-sm md:text-sm text-slate-700 leading-tight">
        {label}
        {hint && <span className="block text-xs text-slate-500 mt-0.5">{hint}</span>}
      </span>
    </label>
  )
}
