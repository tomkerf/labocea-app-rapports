import { Plus, Trash2 } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import type { FieldArrayWithId } from 'react-hook-form'
import type { Intervention } from '../../schemas/intervention'

const numCls =
  'w-full min-h-[44px] px-3 py-2.5 border border-slate-200 rounded-md bg-white text-base focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
const timeCls =
  'w-full min-h-[44px] px-3 py-2.5 border border-slate-200 rounded-md bg-white text-base focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

type Row = FieldArrayWithId<Intervention, never, 'id'>

interface Props {
  mesures: Row[]
  appendMesure: (v: object) => void
  removeMesure: (idx: number) => void
  /** Chemin de base, ex : 'fiche.data.suiviPhysicoChimique.mesures' */
  basePath: string
}

const EMPTY_ROW = {
  tempsPurge: '',
  tempC: null,
  pH: null,
  conductivite25UsCm: null,
  toitPiezoPurgeM: null,
  debitLMin: null,
}

export default function MesuresPurgeTable({ mesures, appendMesure, removeMesure, basePath }: Props) {
  const { register } = useFormContext<Intervention>()

  const path = (idx: number, field: string) => `${basePath}.${idx}.${field}` as never

  return (
    <div className="space-y-3">
      {mesures.length === 0 && (
        <p className="text-sm text-slate-500 italic">Aucune mesure enregistrée.</p>
      )}

      {/* ── Mobile : une card par ligne ── */}
      <div className="md:hidden space-y-3">
        {mesures.map((row, idx) => (
          <div key={row.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mesure {idx + 1}</span>
              <button
                type="button"
                onClick={() => removeMesure(idx)}
                className="text-red-500 hover:bg-red-50 p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Supprimer cette mesure"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Temps purge</label>
              <input type="time" {...register(path(idx, 'tempsPurge'))} className={timeCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">T (°C)</label>
                <input type="number" step="any" inputMode="decimal" placeholder="—"
                  {...register(path(idx, 'tempC'), { valueAsNumber: true })}
                  className={numCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">pH</label>
                <input type="number" step="any" inputMode="decimal" placeholder="—"
                  {...register(path(idx, 'pH'), { valueAsNumber: true })}
                  className={numCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Cond25 (µS/cm)</label>
                <input type="number" step="any" inputMode="decimal" placeholder="—"
                  {...register(path(idx, 'conductivite25UsCm'), { valueAsNumber: true })}
                  className={numCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Toit piézo (m)</label>
                <input type="number" step="any" inputMode="decimal" placeholder="—"
                  {...register(path(idx, 'toitPiezoPurgeM'), { valueAsNumber: true })}
                  className={numCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Q (L/min)</label>
                <input type="number" step="any" inputMode="decimal" placeholder="—"
                  {...register(path(idx, 'debitLMin'), { valueAsNumber: true })}
                  className={numCls} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop : table classique ── */}
      {mesures.length > 0 && (
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 px-2 font-medium">#</th>
                <th className="py-2 px-2 font-medium whitespace-nowrap">Temps purge</th>
                <th className="py-2 px-2 font-medium">T (°C)</th>
                <th className="py-2 px-2 font-medium">pH</th>
                <th className="py-2 px-2 font-medium whitespace-nowrap">Cond25 (µS/cm)</th>
                <th className="py-2 px-2 font-medium whitespace-nowrap">Toit piézo (m)</th>
                <th className="py-2 px-2 font-medium">Q (L/min)</th>
                <th className="py-2 px-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mesures.map((row, idx) => (
                <tr key={row.id} className="align-middle">
                  <td className="px-2 py-1 text-slate-400 text-xs font-mono">{idx + 1}</td>
                  <td className="px-1 py-1">
                    <input type="time"
                      {...register(path(idx, 'tempsPurge'))}
                      className="w-28 px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-brand-500" />
                  </td>
                  {(['tempC', 'pH', 'conductivite25UsCm', 'toitPiezoPurgeM', 'debitLMin'] as const).map((f) => (
                    <td key={f} className="px-1 py-1">
                      <input type="number" step="any" inputMode="decimal"
                        {...register(path(idx, f), { valueAsNumber: true })}
                        className="w-20 px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-brand-500"
                        placeholder="—" />
                    </td>
                  ))}
                  <td className="px-1 py-1">
                    <button type="button" onClick={() => removeMesure(idx)}
                      className="text-red-500 hover:bg-red-50 p-1.5 rounded" aria-label="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={() => appendMesure(EMPTY_ROW)}
        className="inline-flex items-center gap-2 text-sm text-brand-700 hover:text-brand-900 border border-brand-200 hover:border-brand-400 bg-white px-4 py-3 rounded-xl w-full justify-center md:w-auto md:justify-start transition min-h-[44px]"
      >
        <Plus className="w-4 h-4" /> Ajouter une mesure
      </button>
    </div>
  )
}
