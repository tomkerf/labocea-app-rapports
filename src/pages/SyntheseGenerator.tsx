import { useState } from 'react'
import { loadSyntheseMetadata, processSyntheseData, type ParamStat } from '../lib/syntheseDataProcessor'
import { generateInterpretations, groupByFamille, FAMILLE_HEADINGS } from '../lib/syntheseAiWriter'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { Upload, Cpu, Download } from 'lucide-react'

const MILIEUX = ['Eau superficielle', 'Eau souterraine', 'Eau résiduaire', 'Eau de baignade', 'Eau conchylicole']

interface SyntheseResult {
  clientNom: string
  site: string
  milieu: string
  annee: number
  stats: ParamStat[]
  interpretations?: Record<string, string>
}

export default function SyntheseGenerator() {
  const [file, setFile] = useState<File | null>(null)
  const [clientNom, setClientNom] = useState('')
  const [site, setSite] = useState('')
  const [annees, setAnnees] = useState<number[]>([])

  const [selectedMilieu, setSelectedMilieu] = useState<string>(MILIEUX[0])
  const [selectedAnnee, setSelectedAnnee] = useState<number>(new Date().getFullYear() - 1)

  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  
  const [result, setResult] = useState<SyntheseResult | null>(null)
  const [generatingAi, setGeneratingAi] = useState(false)
  const [aiProgress, setAiProgress] = useState('')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setBusy(true)
    setError(null)
    try {
      const meta = await loadSyntheseMetadata(f)
      setClientNom(meta.clientNom)
      setSite(meta.site)
      setAnnees(meta.annees)
      if (meta.annees.length > 0) setSelectedAnnee(meta.annees[0])
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const handleComputeStats = async () => {
    if (!file || !selectedAnnee) return
    setBusy(true)
    setError(null)
    try {
      const res = await processSyntheseData(file, selectedAnnee, selectedMilieu)
      setResult({
        clientNom: res.clientNom,
        site: res.site,
        milieu: res.milieu,
        annee: selectedAnnee,
        stats: res.stats
      })
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const handleGenerateAI = async () => {
    if (!result) return
    const apiKey = localStorage.getItem('anthropic_api_key')
    if (!apiKey) {
      setError('Veuillez configurer votre clé API Anthropic dans les Paramètres.')
      return
    }

    setGeneratingAi(true)
    setError(null)
    try {
      const groups = groupByFamille(result.stats)
      const interpretations = await generateInterpretations(
        apiKey,
        groups,
        result.clientNom,
        result.milieu,
        result.annee,
        (famille) => setAiProgress(FAMILLE_HEADINGS[famille] || famille)
      )
      setResult({ ...result, interpretations })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setGeneratingAi(false)
      setAiProgress('')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (step === 3 && result) {
    const groups = groupByFamille(result.stats)
    const familleOrder = Object.keys(groups).sort()

    return (
      <div className="bg-white min-h-screen pb-20 print:p-0 print:bg-white print:text-black print:text-sm">
        <div className="max-w-5xl mx-auto p-4 md:p-8 print:p-0">
          
          <div className="flex justify-between items-center mb-8 print:hidden">
            <h1 className="text-2xl font-bold">Rapport de synthèse</h1>
            <div className="flex gap-3">
              <button
                onClick={handleGenerateAI}
                disabled={generatingAi || !!result.interpretations}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                <Cpu className="w-4 h-4" />
                {generatingAi ? `Génération IA (${aiProgress})...` : result.interpretations ? 'IA Générée' : 'Rédiger avec IA'}
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-900"
              >
                <Download className="w-4 h-4" />
                Imprimer PDF
              </button>
            </div>
          </div>

          {error && <div className="p-4 mb-4 text-red-700 bg-red-50 rounded-md print:hidden">{error}</div>}

          {/* Report Content */}
          <div className="print:block">
            <header className="mb-10 text-center border-b pb-6">
              <h1 className="text-3xl font-bold uppercase tracking-wide text-brand-900 mb-2">Bilan Qualité de l'Eau</h1>
              <h2 className="text-xl text-slate-600">{result.clientNom}{result.site ? ` — ${result.site}` : ''}</h2>
              <p className="text-slate-500">{result.milieu} · Année {result.annee}</p>
            </header>

            {familleOrder.map(famille => {
              const params = groups[famille]
              const title = FAMILLE_HEADINGS[famille] || famille
              const interpretation = result.interpretations?.[famille]

              return (
                <section key={famille} className="mb-12 print:break-inside-avoid">
                  <h3 className="text-xl font-semibold mb-4 text-brand-800 border-b border-slate-200 pb-2">{title}</h3>
                  
                  {interpretation && (
                    <div className="p-4 bg-slate-50 border-l-4 border-purple-500 rounded-r-md mb-6 italic text-slate-800 whitespace-pre-wrap">
                      {interpretation}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {params.map(p => {
                      const histKeys = Object.keys(p.historique).sort()
                      const chartData = histKeys.map(k => ({ annee: k, valeur: p.historique[k] }))

                      return (
                        <div key={p.parametre} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm print:shadow-none print:border-slate-300">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-slate-800">{p.parametre}</h4>
                            <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-600">
                              {p.unite}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div>
                              <span className="text-slate-500 block text-xs">Moy. {result.annee} (n={p.n})</span>
                              <span className="font-medium">{p.moyenne}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-xs">Seuil ({p.seuil_type || '-'})</span>
                              <span className={`font-medium ${p.depassements > 0 ? 'text-red-600' : ''}`}>
                                {p.seuil ?? 'N/A'} {p.depassements > 0 && `(${p.depassements} dép.)`}
                              </span>
                            </div>
                          </div>

                          {chartData.length > 1 && (
                            <div className="h-48 mt-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                  <XAxis dataKey="annee" fontSize={11} tickMargin={5} />
                                  <YAxis fontSize={11} />
                                  <Tooltip formatter={(value) => [`${value} ${p.unite}`, p.parametre]} labelStyle={{ color: '#334155' }} />
                                  <Line type="monotone" dataKey="valeur" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                  {p.seuil && <ReferenceLine y={p.seuil} stroke="#ef4444" strokeDasharray="3 3" />}
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Synthèse Annuelle</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">Génère un bilan annuel (statistiques et rédaction par IA) à partir d'un export DiPLABO pluriannuel.</p>

      {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4 shadow-sm">
        <h2 className="font-semibold mb-4">Étape 1 : Fichier source</h2>
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-3 text-slate-400" />
              <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Clique pour uploader</span> l'export DiPLABO</p>
              <p className="text-xs text-slate-500">{file ? file.name : "Export DiPLABO « Résultats demandeur » (.xls / .xlsx)"}</p>
            </div>
            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileUpload} />
          </label>
        </div>
        {busy && step === 1 && <p className="text-sm text-slate-500 mt-3 text-center">Analyse du fichier...</p>}
      </div>

      {step >= 2 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Étape 2 : Configuration</h2>
          
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-md text-sm">
            <span className="text-slate-500">Client détecté : </span>
            <span className="font-medium text-slate-800">{clientNom || '—'}</span>
            {site && <span className="text-slate-500"> · {site}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Milieu de prélèvement</label>
              <select
                value={selectedMilieu}
                onChange={e => setSelectedMilieu(e.target.value)}
                className="w-full border-slate-300 rounded-md shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm py-2 px-3 border"
              >
                {MILIEUX.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Année cible</label>
              <select
                value={selectedAnnee}
                onChange={e => setSelectedAnnee(Number(e.target.value))}
                className="w-full border-slate-300 rounded-md shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm py-2 px-3 border"
              >
                {annees.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleComputeStats}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-2 px-4 rounded-md hover:bg-brand-700 transition font-medium"
          >
            {busy ? 'Calcul des statistiques...' : 'Générer le rapport'}
          </button>
        </div>
      )}
    </div>
  )
}
