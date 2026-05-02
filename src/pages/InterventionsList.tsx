import { Link } from 'react-router'
import { ClipboardList, Plus, Search } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useInterventions } from '../db/interventions'
import { cn } from '../lib/cn'
import { relativeDate } from '../lib/relativeDate'

const statutLabel: Record<string, { label: string; cls: string }> = {
  brouillon: { label: 'Brouillon', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  en_cours: { label: 'En cours', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  finalise: { label: 'Finalisé', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  reception_labo: { label: 'Réception labo', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
}

const typeFicheLabel: Record<string, string> = {
  PAUTO: 'Prélèvement auto (0120)',
  ESO: 'ESO — Suivi ENV (0114)',
  ESO_SSP: 'ESO — Sites pollués (0114)',
  ESU: 'Eaux superficielles (0117)',
}

export default function InterventionsList() {
  const interventions = useInterventions()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!interventions) return []
    const q = search.trim().toLowerCase()
    if (!q) return interventions
    return interventions.filter((i) => {
      const hay = [
        i.identification.client,
        i.identification.site,
        i.identification.operateur,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [interventions, search])

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <header className="flex items-center justify-between gap-3 mb-5 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-2xl font-bold tracking-tight">Interventions</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {interventions?.length ?? 0} fiche{(interventions?.length ?? 0) > 1 ? 's' : ''} enregistrée{(interventions?.length ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/nouvelle"
          className="hidden md:inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition"
        >
          <Plus className="w-4 h-4" /> Nouvelle
        </Link>
      </header>

      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Client, site, opérateur…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 min-h-[44px] border border-slate-200 rounded-lg bg-white text-base focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState hasInterventions={(interventions?.length ?? 0) > 0} />
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((i) => {
            const statut = statutLabel[i.meta.statut] ?? statutLabel.brouillon
            return (
              <li key={i.meta.id}>
                <Link
                  to={`/intervention/${i.meta.id}`}
                  className="block bg-white border border-slate-200 rounded-xl px-4 py-4 active:scale-[0.99] hover:border-brand-300 hover:shadow-sm transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-base text-slate-900 truncate">
                        {i.identification.site || <em className="text-slate-400 font-normal">Site non renseigné</em>}
                      </div>
                      <div className="text-sm text-slate-600 truncate mt-0.5">
                        {i.identification.client || '—'} · {i.identification.operateur || '—'}
                      </div>
                      <div className="text-xs text-slate-400 mt-2">
                        {typeFicheLabel[i.meta.typeFiche]} · {relativeDate(i.meta.updatedAt)}
                      </div>
                    </div>
                    <span className={cn('shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border', statut.cls)}>
                      {statut.label}
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {/* FAB mobile */}
      <Link
        to="/nouvelle"
        className="md:hidden fixed right-5 inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-3.5 rounded-full shadow-lg shadow-brand-600/30 active:scale-95 transition"
        style={{ bottom: 'calc(76px + env(safe-area-inset-bottom))' }}
        aria-label="Nouvelle intervention"
      >
        <Plus className="w-5 h-5" />
        <span className="text-sm font-semibold pr-1">Nouvelle</span>
      </Link>
    </div>
  )
}

function EmptyState({ hasInterventions }: { hasInterventions: boolean }) {
  return (
    <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
      <div className="grid place-items-center w-12 h-12 mx-auto rounded-full bg-slate-100 mb-3">
        <ClipboardList className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-slate-700 font-medium">
        {hasInterventions ? 'Aucun résultat' : 'Aucune intervention'}
      </p>
      <p className="text-sm text-slate-500 mt-1">
        {hasInterventions
          ? 'Modifie ta recherche ou crée une nouvelle fiche.'
          : 'Crée ta première fiche terrain pour commencer.'}
      </p>
      <Link
        to="/nouvelle"
        className="inline-flex items-center gap-2 mt-4 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition"
      >
        <Plus className="w-4 h-4" /> Nouvelle intervention
      </Link>
    </div>
  )
}

