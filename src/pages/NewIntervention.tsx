import { useNavigate } from 'react-router'
import { useState } from 'react'
import { Droplet, Beaker, Waves, FlaskConical, ArrowLeft } from 'lucide-react'
import { createIntervention } from '../db/interventions'
import type { TypeFiche } from '../schemas/common'
import { cn } from '../lib/cn'

const types = [
  {
    id: 'PAUTO' as const,
    label: 'Prélèvement automatique',
    sub: 'PENV-SU-0120 · effluents (asservi au débit)',
    desc: 'Bilan 24h sur 1 dispositif (canal Venturi, débitmètre…).',
    icon: Beaker,
    enabled: true,
  },
  {
    id: 'ESO' as const,
    label: 'Eaux souterraines — Suivi ENV',
    sub: 'PENV-SU-0114 · FD T 90-523-3 · piézomètre / forage',
    desc: 'Purge 3×Vc, suivi physico-chimique, O₂, salinité.',
    icon: Droplet,
    enabled: true,
  },
  {
    id: 'ESO_SSP' as const,
    label: 'Eaux souterraines — Sites pollués',
    sub: 'PENV-SU-0114 · NF X 31-615 · SSP',
    desc: 'Purge 3-5×Vp, gestion eaux de purge, phases flottante/plongeante.',
    icon: FlaskConical,
    enabled: true,
  },
  {
    id: 'ESU' as const,
    label: 'Eaux superficielles',
    sub: 'PENV-SU-0117 · rivière, eaux salines, résiduaires',
    desc: 'Échantillonnage ponctuel ou composite manuel.',
    icon: Waves,
    enabled: true,
  },
]

export default function NewIntervention() {
  const navigate = useNavigate()
  const [creating, setCreating] = useState<string | null>(null)

  const handlePick = async (typeId: TypeFiche) => {
    setCreating(typeId)
    try {
      const i = await createIntervention(typeId)
      navigate(`/intervention/${i.meta.id}`)
    } finally {
      setCreating(null)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>
      <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Nouvelle intervention</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">Choisis le type de fiche terrain à remplir.</p>

      <div className="grid gap-3">
        {types.map((t) => (
          <button
            key={t.id}
            disabled={!t.enabled || creating !== null}
            onClick={() => handlePick(t.id)}
            className={cn(
              'text-left bg-white border rounded-xl p-4 flex gap-4 items-start transition',
              t.enabled
                ? 'border-slate-200 hover:border-brand-400 hover:shadow-sm cursor-pointer'
                : 'border-slate-100 opacity-60 cursor-not-allowed',
            )}
          >
            <div className={cn(
              'grid place-items-center w-10 h-10 rounded-lg shrink-0',
              t.enabled ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-400',
            )}>
              <t.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{t.label}</span>
                {!t.enabled && <span className="text-[10px] uppercase tracking-wide bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Bientôt</span>}
              </div>
              <div className="text-xs text-slate-500">{t.sub}</div>
              <div className="text-sm text-slate-600 mt-1">{t.desc}</div>
            </div>
            {creating === t.id && <span className="text-xs text-brand-700 self-center">Création…</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
