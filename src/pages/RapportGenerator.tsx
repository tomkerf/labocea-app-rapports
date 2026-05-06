/**
 * Page de génération de rapport d'intervention.
 * Page autonome — indépendante des fiches terrain.
 * Workflow : N° rapport → import XLS DiPLABO → VLE → volume → génération .docx
 */
import { useState, useRef, useCallback } from 'react'
import { FileSpreadsheet, FileText, ChevronDown, ChevronUp, Loader2, Beaker } from 'lucide-react'
import { db } from '../db/db'
import { parseDiplaboFile, type ParsedDiplabo } from '../lib/parseDiplabo'
import { genererRapportDocx, type VleEntry } from '../lib/rapportDocx'
import { useTechnicienInitiales } from '../db/techniciens'

// ─── Composants UI locaux ─────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className ?? ''}`}
    />
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function RapportGenerator() {
  const techInitiales = useTechnicienInitiales()

  const [diplabo, setDiplabo] = useState<ParsedDiplabo | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)

  const [numRapport, setNumRapport] = useState('')
  const [redacteur, setRedacteur] = useState('')
  const [typeCampagne, setTypeCampagne] = useState<'PAUTO' | 'autre'>('autre')
  const [vle, setVle] = useState<Record<string, VleEntry>>({})
  const [volumeM3Str, setVolumeM3Str] = useState('')

  const [generating, setGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(true)

  const fileRef = useRef<HTMLInputElement>(null)

  // ── Chargement des VLE mémorisées pour ce client ──
  const loadVleForClient = useCallback(async (clientNom: string, params: string[]) => {
    const saved = await db.vleConfigs.get(clientNom)
    const initial: Record<string, VleEntry> = {}
    for (const p of params) {
      const s = saved?.params[p]
      initial[p] = { vle: s?.vle ?? '', unite: s?.unite ?? '', vleCharge: s?.vleCharge ?? '' }
    }
    setVle(initial)
  }, [])

  // ── Import fichier DiPLABO ──
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setParsing(true)
    setParseError(null)
    try {
      const parsed = await parseDiplaboFile(file)
      setDiplabo(parsed)
      const params = parsed.lignes.map((l) => l.parametre)
      await loadVleForClient(parsed.meta.client, params)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Erreur de lecture du fichier')
    } finally {
      setParsing(false)
    }
  }

  // ── Mise à jour d'une VLE ──
  const setVleValue = (parametre: string, field: 'vle' | 'unite' | 'vleCharge', value: string) => {
    setVle((prev) => ({
      ...prev,
      [parametre]: { ...prev[parametre], [field]: value },
    }))
  }

  // ── Génération ──
  const handleGenerate = async () => {
    if (!diplabo || !numRapport || !redacteur) return
    setGenerating(true)
    try {
      await db.vleConfigs.put({ clientNom: diplabo.meta.client, params: vle })

      const volumeM3 = parseFloat(volumeM3Str.replace(',', '.'))

      await genererRapportDocx({
        numRapport,
        redacteur,
        diplabo,
        vle,
        volumeM3: typeCampagne === 'PAUTO' && !isNaN(volumeM3) && volumeM3 > 0
          ? volumeM3
          : undefined,
        // intervention vide — les champs sont issus directement du DiPLABO
        intervention: {
          meta: { id: '', typeFiche: typeCampagne === 'PAUTO' ? 'PAUTO' : 'ESU', createdAt: '', updatedAt: '', statut: 'brouillon' },
          identification: {
            client: diplabo.meta.client,
            site: diplabo.meta.site,
            dateDebut: diplabo.meta.datePrelevement,
            operateur: redacteur,
          },
          fiche: typeCampagne === 'PAUTO'
            ? {
                typeFiche: 'PAUTO',
                data: {
                  volumeGlobal: { volumeRejeteM3: parseFloat(volumeM3Str.replace(',', '.')) || undefined },
                },
              }
            : undefined,
        } as never,
      })
    } catch (err) {
      console.error('[RapportGenerator] Erreur génération', err)
      alert('Erreur lors de la génération du rapport.')
    } finally {
      setGenerating(false)
    }
  }

  const canGenerate = !!diplabo && !!numRapport && !!redacteur
  const volumeM3Preview = parseFloat(volumeM3Str.replace(',', '.'))
  const hasVolume = typeCampagne === 'PAUTO' && !isNaN(volumeM3Preview) && volumeM3Preview > 0

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Générer un rapport</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {diplabo
            ? `${diplabo.meta.client} — ${diplabo.meta.site}`
            : 'Importez un export DiPLABO pour commencer'}
        </p>
      </div>

      {/* ── Étape 1 : Informations rapport ── */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
          Informations du rapport
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label required>N° de rapport</Label>
            <Input
              value={numRapport}
              onChange={(e) => setNumRapport(e.target.value)}
              placeholder="ex : 26-011"
            />
          </div>
          <div>
            <Label required>Rédacteur</Label>
            <Input
              value={redacteur}
              onChange={(e) => setRedacteur(e.target.value)}
              placeholder="ex : T. Kerfendal"
              list="rapport-tech-list"
            />
            <datalist id="rapport-tech-list">
              {techInitiales.map((i) => <option key={i} value={i} />)}
            </datalist>
          </div>
          <div>
            <Label>Type de campagne</Label>
            <select
              value={typeCampagne}
              onChange={(e) => setTypeCampagne(e.target.value as 'PAUTO' | 'autre')}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="autre">ESO / ESU / Ponctuel</option>
              <option value="PAUTO">PAUTO (prélèvement automatique)</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Étape 2 : Import DiPLABO ── */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
          Import DiPLABO
        </h2>

        <div
          className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <FileSpreadsheet className="mx-auto mb-2 text-slate-400" size={32} />
          {diplabo ? (
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-slate-700">
                ✓ {diplabo.lignes.length} paramètres — {diplabo.points.length} point(s)
              </p>
              <p className="text-xs text-slate-500">
                {diplabo.meta.client} · {diplabo.meta.datePrelevement}
              </p>
              <p className="text-xs text-blue-600 mt-1">Cliquer pour changer de fichier</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600">Cliquer pour importer le fichier XLS DiPLABO</p>
              <p className="text-xs text-slate-400 mt-1">Formats acceptés : .xls, .xlsx</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".xls,.xlsx"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        {parsing && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 size={14} className="animate-spin" /> Lecture en cours…
          </div>
        )}
        {parseError && <p className="text-sm text-red-600">{parseError}</p>}

        {/* Aperçu résultats */}
        {diplabo && (
          <div>
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showPreview ? "Masquer l'aperçu" : "Voir l'aperçu des résultats"}
            </button>

            {showPreview && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-200 px-2 py-1 text-left font-medium">Paramètre</th>
                      <th className="border border-slate-200 px-2 py-1 font-medium">Unité</th>
                      {diplabo.points.map((p) => (
                        <th key={p} className="border border-slate-200 px-2 py-1 font-medium text-blue-700">{p}</th>
                      ))}
                      {hasVolume && diplabo.points.map((p) => (
                        <th key={`c-${p}`} className="border border-slate-200 px-2 py-1 font-medium text-emerald-700">
                          Charge {p} (kg)
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {diplabo.lignes.map((ligne, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="border border-slate-200 px-2 py-1">{ligne.parametre}</td>
                        <td className="border border-slate-200 px-2 py-1 text-center">{ligne.unite}</td>
                        {diplabo.points.map((p) => (
                          <td key={p} className="border border-slate-200 px-2 py-1 text-center">
                            {ligne.resultats[p] ?? '—'}
                          </td>
                        ))}
                        {hasVolume && diplabo.points.map((p) => {
                          const r = ligne.resultats[p] ?? '—'
                          if (r === '—') return (
                            <td key={`c-${p}`} className="border border-slate-200 px-2 py-1 text-center text-slate-400">—</td>
                          )
                          const prefix = r.startsWith('<') ? '< ' : ''
                          const val = parseFloat(r.replace('<', '').replace(',', '.'))
                          if (isNaN(val)) return (
                            <td key={`c-${p}`} className="border border-slate-200 px-2 py-1 text-center text-slate-400">—</td>
                          )
                          const kg = val * volumeM3Preview * 0.001
                          const str = prefix + (kg < 1 ? kg.toFixed(3) : kg.toFixed(2)).replace('.', ',')
                          return (
                            <td key={`c-${p}`} className="border border-slate-200 px-2 py-1 text-center text-emerald-700 font-medium">
                              {str}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Étape 3 : VLE ── */}
      {diplabo && (
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
            Valeurs limites d'émission (VLE)
          </h2>
          <p className="text-xs text-slate-400">Laisser vide si pas de limite réglementaire. Valeurs mémorisées par client.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 px-3 py-2 text-left font-medium text-slate-600">Paramètre</th>
                  <th className="border border-slate-200 px-3 py-2 font-medium text-slate-600 w-28">
                    VLE conc.
                  </th>
                  <th className="border border-slate-200 px-3 py-2 font-medium text-slate-600 w-24">Unité</th>
                  {typeCampagne === 'PAUTO' && (
                    <th className="border border-slate-200 px-3 py-2 font-medium text-emerald-700 w-28">
                      VLE charge (kg/j)
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {diplabo.lignes.map((ligne, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-200 px-3 py-1 text-slate-700">{ligne.parametre}</td>
                    <td className="border border-slate-200 px-1 py-1">
                      <input
                        type="text"
                        value={vle[ligne.parametre]?.vle ?? ''}
                        onChange={(e) => setVleValue(ligne.parametre, 'vle', e.target.value)}
                        placeholder="—"
                        className="w-full border-0 bg-transparent px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                      />
                    </td>
                    <td className="border border-slate-200 px-1 py-1">
                      <input
                        type="text"
                        value={vle[ligne.parametre]?.unite ?? ligne.unite}
                        onChange={(e) => setVleValue(ligne.parametre, 'unite', e.target.value)}
                        placeholder={ligne.unite}
                        className="w-full border-0 bg-transparent px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                      />
                    </td>
                    {typeCampagne === 'PAUTO' && (
                      <td className="border border-slate-200 px-1 py-1">
                        <input
                          type="text"
                          value={vle[ligne.parametre]?.vleCharge ?? ''}
                          onChange={(e) => setVleValue(ligne.parametre, 'vleCharge', e.target.value)}
                          placeholder="—"
                          className="w-full border-0 bg-transparent px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded text-emerald-700"
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Étape 4 : Volume + charges (PAUTO uniquement) ── */}
      {typeCampagne === 'PAUTO' && (
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">4</span>
            Volume rejeté &amp; charges de pollution
          </h2>
          <p className="text-xs text-slate-400">
            Renseigner le volume pour calculer les charges (kg). Laisser vide pour ne pas inclure ce tableau dans le rapport.
          </p>
          <div className="flex items-end gap-3">
            <div className="w-48">
              <Label>Volume rejeté</Label>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={volumeM3Str}
                  onChange={(e) => setVolumeM3Str(e.target.value)}
                  placeholder="ex : 1250"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">m³</span>
              </div>
            </div>
            {hasVolume && (
              <div className="flex items-center gap-1.5 text-sm text-emerald-700 pb-2">
                <Beaker size={14} />
                Charges visibles dans l'aperçu
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Bouton générer ── */}
      <div className="flex justify-end pb-8">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || generating}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {generating
            ? <><Loader2 size={16} className="animate-spin" /> Génération…</>
            : <><FileText size={16} /> Générer le rapport Word</>
          }
        </button>
      </div>
    </div>
  )
}
