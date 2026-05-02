import { useState } from 'react'
import { db } from '../db/db'
import { Trash2, Database } from 'lucide-react'

export default function Settings() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const handleClear = async () => {
    if (!confirm('Effacer TOUTES les interventions enregistrées localement ? Cette action est irréversible.')) return
    setBusy(true)
    try {
      await db.interventions.clear()
      await db.blobs.clear()
      setMsg('Base locale effacée.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Paramètres</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">Préférences de l'app et gestion des données locales.</p>

      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-5 h-5 text-slate-500" />
          <h2 className="font-semibold">Données locales</h2>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Toutes tes interventions sont stockées dans le navigateur (IndexedDB), accessibles hors-ligne.
          Aucune donnée n'est envoyée à un serveur pour le moment.
        </p>
        <button
          onClick={handleClear}
          disabled={busy}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-red-200 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" /> Effacer la base locale
        </button>
        {msg && <p className="text-xs text-slate-500 mt-3">{msg}</p>}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 mt-4">
        <h2 className="font-semibold mb-2">À propos</h2>
        <p className="text-sm text-slate-600">
          App de saisie terrain &amp; rapports d'intervention pour Labocea.
          Version MVP — fiche PENV-SU-0120 (prélèvement automatique).
        </p>
      </section>
    </div>
  )
}
