import { useId } from 'react'
import { useEquipementsByCategorie, equipementLabel } from '../../db/equipements'
import { cn } from '../../lib/cn'

const inputCls =
  'w-full min-h-[44px] px-3 py-3 md:py-2 border border-slate-200 rounded-md bg-white text-base md:text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50'

interface Props {
  /** Catégories Firestore à proposer, ex: ['pompe_pz'] ou ['sonde_niveau','multiparametre'] */
  categories: string | string[]
  value?: string
  onChange: (v: string) => void
  placeholder?: string
  name?: string
}

/**
 * Champ texte avec liste de suggestions issues du matériel PMC v2.
 * Fonctionne en saisie libre si le matériel n'est pas synchronisé.
 */
export default function EquipementPicker({ categories, value, onChange, placeholder, name }: Props) {
  const listId = useId()
  const equipements = useEquipementsByCategorie(categories)

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
        className={cn(inputCls, equipements.length > 0 && 'pr-8')}
      />
      {equipements.length > 0 && (
        <datalist id={listId}>
          {equipements.map((e) => (
            <option key={e.id} value={equipementLabel(e)} />
          ))}
        </datalist>
      )}
    </>
  )
}
