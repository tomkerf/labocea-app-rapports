import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'

export type FillState = 'empty' | 'partial' | 'full'

export function Section({
  title,
  description,
  children,
  defaultOpen = false,
  badge,
  fillState,
}: {
  title: string
  description?: string
  children: ReactNode
  defaultOpen?: boolean
  badge?: ReactNode
  fillState?: FillState
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 md:px-5 py-4 text-left hover:bg-slate-50 active:bg-slate-100 transition min-h-[56px]"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {fillState && <FillDot state={fillState} />}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-slate-900 text-[15px] md:text-base">{title}</h2>
              {badge}
            </div>
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
          </div>
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-slate-400 shrink-0 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div className="px-4 md:px-5 pb-5 pt-3 border-t border-slate-100 space-y-5">
          {children}
        </div>
      )}
    </section>
  )
}

function FillDot({ state }: { state: FillState }) {
  const map = {
    empty: { cls: 'bg-slate-200', title: 'Section vide' },
    partial: { cls: 'bg-amber-400', title: 'Section partiellement remplie' },
    full: { cls: 'bg-emerald-500', title: 'Section complète' },
  } as const
  const { cls, title } = map[state]
  return (
    <span
      className={cn('shrink-0 w-2.5 h-2.5 rounded-full', cls)}
      title={title}
      aria-label={title}
    />
  )
}

export function FieldGrid({ children, cols = 2 }: { children: ReactNode; cols?: 1 | 2 | 3 | 4 }) {
  const cls = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  }[cols]
  // Gap plus grand sur mobile pour aérer
  return <div className={cn('grid gap-5 md:gap-4', cls)}>{children}</div>
}
