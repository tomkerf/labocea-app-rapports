import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { FormProvider, useForm } from 'react-hook-form'
import { ArrowLeft, Trash2, Check, CloudOff, Loader2 } from 'lucide-react'
import {
  useIntervention,
  saveIntervention,
  deleteIntervention,
  setStatut,
} from '../db/interventions'
import type { Intervention } from '../schemas/intervention'
import PautoForm from './forms/PautoForm'
import EsoForm from './forms/EsoForm'
import EsoSspForm from './forms/EsoSspForm'
import EsuForm from './forms/EsuForm'

const typeFicheLabel: Record<string, string> = {
  PAUTO: 'PENV-SU-0120',
  ESO: 'PENV-SU-0114 ENV',
  ESO_SSP: 'PENV-SU-0114 SSP',
  ESU: 'PENV-SU-0117',
}

export default function InterventionForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const data = useIntervention(id)
  const loading = data === undefined

  if (loading) return <Loader />
  if (!data) return <NotFound />

  return <InterventionEditor key={data.meta.id} initial={data} navigate={(p) => navigate(p)} />
}

function InterventionEditor({
  initial,
  navigate,
}: {
  initial: Intervention
  navigate: (path: string) => void
}) {
  const methods = useForm<Intervention>({
    defaultValues: initial,
    mode: 'onBlur',
  })
  const { handleSubmit, watch } = methods
  const lastSavedRef = useRef<string>(JSON.stringify(initial))
  const savingRef = useRef(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Auto-save : à chaque changement de valeur, on enregistre dans Dexie (debounce 500 ms)
  useEffect(() => {
    let savedHideTimer: ReturnType<typeof setTimeout> | undefined
    const subscription = watch((value) => {
      const json = JSON.stringify(value)
      if (json === lastSavedRef.current) return
      setSaveState('saving')
      const t = setTimeout(async () => {
        if (savingRef.current) return
        savingRef.current = true
        try {
          await saveIntervention(value as Intervention)
          lastSavedRef.current = json
          setSaveState('saved')
          clearTimeout(savedHideTimer)
          savedHideTimer = setTimeout(() => setSaveState('idle'), 1500)
        } finally {
          savingRef.current = false
        }
      }, 500)
      return () => clearTimeout(t)
    })
    return () => {
      subscription.unsubscribe()
      clearTimeout(savedHideTimer)
    }
  }, [watch])

  const onFinalize = handleSubmit(async (values) => {
    await saveIntervention(values)
    await setStatut(values.meta.id, 'finalise')
    navigate('/')
  })

  const onDelete = async () => {
    if (!confirm('Supprimer définitivement cette intervention ?')) return
    await deleteIntervention(initial.meta.id)
    navigate('/')
  }

  const titre =
    initial.identification.site ||
    initial.identification.client ||
    'Nouvelle intervention'

  const refLabel = typeFicheLabel[initial.meta.typeFiche] ?? initial.meta.typeFiche

  return (
    <FormProvider {...methods}>
      <form onSubmit={onFinalize}>
        {/* Header sticky */}
        <div
          className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 z-20"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="max-w-5xl mx-auto px-3 md:px-8 py-2.5 md:py-3 flex items-center gap-1 md:gap-2">
            <Link
              to="/"
              className="text-slate-500 hover:text-slate-900 inline-flex items-center justify-center gap-1 text-sm min-h-[44px] min-w-[44px] rounded-md hover:bg-slate-100"
              aria-label="Retour à la liste"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden md:inline pr-1">Retour</span>
            </Link>
            <div className="flex-1 min-w-0 px-1">
              <div className="text-sm md:text-base font-semibold truncate leading-tight">{titre}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="hidden sm:inline">{refLabel}</span>
                <SaveIndicator state={saveState} />
              </div>
            </div>
            <button
              type="button"
              onClick={onDelete}
              className="text-red-600 hover:bg-red-50 inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-md"
              title="Supprimer"
              aria-label="Supprimer l'intervention"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              type="submit"
              className="hidden md:inline-flex items-center gap-1 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-brand-700"
            >
              <Check className="w-4 h-4" /> Finaliser
            </button>
          </div>
        </div>

        <div
          className="max-w-5xl mx-auto p-4 md:p-8 space-y-3"
          style={{ paddingBottom: 'calc(180px + env(safe-area-inset-bottom))' }}
        >
          {initial.meta.typeFiche === 'ESO'
            ? <EsoForm />
            : initial.meta.typeFiche === 'ESO_SSP'
              ? <EsoSspForm />
              : initial.meta.typeFiche === 'ESU'
                ? <EsuForm />
                : <PautoForm />}
        </div>

        {/* Bouton finaliser mobile (au-dessus du bottom nav, avec safe-area) */}
        <div
          className="md:hidden fixed inset-x-0 px-4 z-10"
          style={{ bottom: 'calc(76px + env(safe-area-inset-bottom))' }}
        >
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 text-white py-3.5 rounded-xl shadow-lg shadow-brand-600/30 active:scale-[0.98] transition font-semibold"
          >
            <Check className="w-5 h-5" /> Finaliser l'intervention
          </button>
        </div>
      </form>
    </FormProvider>
  )
}

function SaveIndicator({ state }: { state: 'idle' | 'saving' | 'saved' }) {
  if (state === 'saving') {
    return (
      <span className="inline-flex items-center gap-1 text-slate-500">
        <Loader2 className="w-3 h-3 animate-spin" />
        Sauvegarde…
      </span>
    )
  }
  if (state === 'saved') {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600">
        <Check className="w-3 h-3" />
        Enregistré
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-slate-400">
      <CloudOff className="w-3 h-3" />
      Hors-ligne
    </span>
  )
}

function Loader() {
  return (
    <div className="p-8 text-sm text-slate-500">Chargement…</div>
  )
}

function NotFound() {
  return (
    <div className="p-8 max-w-xl mx-auto">
      <h2 className="text-lg font-semibold">Intervention introuvable</h2>
      <p className="text-sm text-slate-500 mt-1">Cette fiche n'existe pas ou a été supprimée.</p>
      <Link to="/" className="inline-flex items-center gap-1 text-brand-700 mt-3 text-sm">
        <ArrowLeft className="w-4 h-4" /> Retour à la liste
      </Link>
    </div>
  )
}
