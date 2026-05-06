import { useId } from 'react'
import { useAllTuyaux, tuyauLabel } from '../../db/tuyaux'
import { cn } from '../../lib/cn'

const inputCls =
  'w-full min-h-[44px] px-3 py-3 md:py-2 border border-slate-200 rounded-md bg-white text-base md:text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50'

interface Props {
  value?: string
  onChange: (v: string) => void
  placeholder?: string
  name?: string
}

/**
 * Champ texte avec liste de suggestions de tuyaux de prélèvement depuis PMC v2.
 * Fonctionne en saisie libre si les tuyaux ne sont pas synchronisés.
 */
export default function TuyauPicker({ value, onChange, placeholder, name }: Props) {
  const listId = useId()
  const tuyaux = useAllTuyaux()

  return (
    <>
      <input
        type="text"
        name={name}
        list={listId}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Saisir ou choisir…'}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="next"
        className={cn(inputCls, tuyaux.length > 0 && 'pr-8')}
      />
      {tuyaux.length > 0 && (
        <datalist id={listId}>
          {tuyaux.map((t) => (
            <option key={t.id} value={tuyauLabel(t)} />
          ))}
        </datalist>
      )}
    </>
  )
}
