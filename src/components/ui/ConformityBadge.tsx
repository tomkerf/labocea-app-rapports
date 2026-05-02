import { Check, X, Minus } from 'lucide-react'
import type { Conformity } from '../../lib/conformity'
import { cn } from '../../lib/cn'

export function ConformityBadge({
  result,
  label,
  size = 'md',
}: {
  result: Conformity
  label?: string
  size?: 'sm' | 'md'
}) {
  const cfg = {
    conforme: {
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Icon: Check,
      txt: 'Conforme',
    },
    non_conforme: {
      cls: 'bg-red-50 text-red-700 border-red-200',
      Icon: X,
      txt: 'Non conforme',
    },
    pending: {
      cls: 'bg-slate-50 text-slate-500 border-slate-200',
      Icon: Minus,
      txt: 'En attente',
    },
  } as const

  const c = cfg[result.status]
  const padCls = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs'

  return (
    <div className="space-y-1">
      {label && <div className="text-xs font-medium text-slate-700">{label}</div>}
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border font-medium',
          padCls,
          c.cls,
        )}
        role="status"
        aria-live="polite"
      >
        <c.Icon className="w-3.5 h-3.5" />
        {c.txt}
      </div>
      {result.detail && (
        <p className="text-xs text-slate-500 leading-snug">{result.detail}</p>
      )}
    </div>
  )
}

/**
 * Variante compacte qui affiche juste le statut + détail en ligne.
 * Utile en pied de section / inline dans un FieldGrid.
 */
export function ConformityInline({ result }: { result: Conformity }) {
  return <ConformityBadge result={result} size="sm" />
}
