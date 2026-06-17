/**
 * Moteur de calcul de la synthèse annuelle.
 *
 * Source de données : export DiPLABO « Résultats demandeur » (mono-feuille),
 * le même format que le module rapport (cf. parseDiplabo.ts) — mais ici on
 * conserve la colonne « Date Analyse » pour reconstituer un historique annuel.
 *
 * Transposition fidèle de la logique Python (synthese-pollution/src/data_processor.py) :
 * moyenne / min / max par paramètre, tendance vs année précédente, historique annuel.
 * Différences imposées par DiPLABO : pas de feuille `seuils` (seuil = null) ni de
 * colonne `famille` (déduite par mots-clés sur le nom du paramètre).
 */
import * as XLSX from 'xlsx'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Tendance = 'stable' | 'hausse' | 'baisse'

export interface ParamStat {
  parametre: string
  unite: string
  n: number
  moyenne: number
  min: number
  max: number
  seuil: number | null
  seuil_type: string | null
  depassements: number
  tendance: Tendance
  famille: string
  historique: Record<string, number>
}

export interface SyntheseMetadata {
  clientNom: string
  site: string
  annees: number[]
}

export interface SyntheseResultData {
  clientNom: string
  site: string
  milieu: string
  stats: ParamStat[]
}

/** Une mesure unitaire extraite de l'export DiPLABO. */
interface Mesure {
  parametre: string
  unite: string
  date: Date
  valeur: number
}

// ─── Familles de polluants (mapping par mots-clés) ──────────────────────────────

const FAMILLE_KEYWORDS: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['nutriments', ['nitrate', 'nitrite', 'ammonium', 'azote', 'phosphore', 'phosphate', 'orthophosphate', 'ntk']],
  ['physico_chimie', ['ph', 'conductivite', 'temperature', 'oxygene', 'mes', 'matiere en suspension', 'dbo', 'dco', 'carbone organique', 'cot', 'turbidite', 'chlorure', 'sulfate', 'salinite']],
  ['metaux', ['plomb', 'cadmium', 'mercure', 'zinc', 'cuivre', 'nickel', 'chrome', 'arsenic', 'fer', 'aluminium', 'manganese', 'cobalt', 'baryum', 'selenium', 'antimoine']],
  ['microbiologie', ['escherichia', 'e. coli', 'e.coli', 'coliforme', 'enterocoque', 'streptocoque', 'spores', 'salmonelle']],
]

/** Supprime les accents et passe en minuscules pour un matching robuste. */
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function familleFor(parametre: string): string {
  const p = normalize(parametre)
  for (const [famille, keywords] of FAMILLE_KEYWORDS) {
    if (keywords.some((kw) => p.includes(kw))) return famille
  }
  return 'autres'
}

// ─── Helpers de parsing ─────────────────────────────────────────────────────────

/** Parse une date DiPLABO ("JJ/MM/AAAA", "JJ-MM-AAAA" ou sérial Excel). */
function parseDateVal(val: unknown): Date | null {
  if (val == null || val === '') return null
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val
  if (typeof val === 'number') {
    // Sérial Excel → JS Date
    const utcDays = Math.floor(val - 25569)
    const d = new Date(utcDays * 86400 * 1000)
    return isNaN(d.getTime()) ? null : d
  }
  const s = String(val).trim()
  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/)
  if (m) {
    const [, dd, mm, yy] = m
    const year = yy.length === 2 ? 2000 + Number(yy) : Number(yy)
    const d = new Date(year, Number(mm) - 1, Number(dd))
    return isNaN(d.getTime()) ? null : d
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Parse un résultat DiPLABO en nombre.
 * Retourne null pour les valeurs non quantifiées (« < LQ », « < 0,5 », vides),
 * exclues des statistiques — comme le `dropna()` du Python.
 */
function parseNumericVal(val: unknown): number | null {
  if (typeof val === 'number') return isNaN(val) ? null : val
  if (typeof val !== 'string') return null
  const s = val.trim()
  if (!s || s.startsWith('<') || s.startsWith('>')) return null
  const cleaned = s.replace(',', '.').replace(/[^\d.-]/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

const round2 = (n: number): number => Math.round(n * 100) / 100
const mean = (vals: number[]): number => vals.reduce((a, b) => a + b, 0) / vals.length

// ─── Lecture du fichier ──────────────────────────────────────────────────────────

interface ColumnIndex {
  client: number
  site: number
  parametre: number
  date: number
  resultat: number
  unite: number
}

function locateColumns(rawRows: string[][]): { headerIdx: number; cols: ColumnIndex } {
  let headerIdx = -1
  for (let i = 0; i < rawRows.length; i++) {
    if (rawRows[i].some((cell) => String(cell).trim() === 'PARAMETRE')) {
      headerIdx = i
      break
    }
  }
  if (headerIdx === -1) {
    throw new Error(
      'Format DiPLABO non reconnu : colonne "PARAMETRE" introuvable. ' +
      "Vérifiez que le fichier est bien un export DiPLABO de type « Résultats demandeur »."
    )
  }
  const headers = rawRows[headerIdx].map((h) => String(h).trim())
  const col = (name: string): number => headers.indexOf(name)
  const cols: ColumnIndex = {
    client: col('Client'),
    site: col('Site de prélèvement'),
    parametre: col('PARAMETRE'),
    date: col('Date Analyse'),
    resultat: col('RESULTAT'),
    unite: col('Unité'),
  }
  if (cols.parametre === -1 || cols.resultat === -1 || cols.date === -1) {
    throw new Error(
      'Colonnes DiPLABO manquantes : « PARAMETRE », « RESULTAT » et « Date Analyse » sont requises pour la synthèse annuelle.'
    )
  }
  return { headerIdx, cols }
}

function readMesures(file: ArrayBuffer): { mesures: Mesure[]; clientNom: string; site: string } {
  const wb = XLSX.read(file, { type: 'array', cellDates: false })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rawRows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, raw: false, defval: '' })
  if (rawRows.length === 0) throw new Error('Fichier DiPLABO vide ou illisible.')

  const { headerIdx, cols } = locateColumns(rawRows)
  const dataRows = rawRows
    .slice(headerIdx + 1)
    .filter((row) => row.some((c) => String(c).trim() !== ''))

  let clientNom = ''
  let site = ''
  const mesures: Mesure[] = []

  for (const row of dataRows) {
    const parametre = String(row[cols.parametre] ?? '').trim()
    if (!parametre) continue
    if (!clientNom && cols.client >= 0) clientNom = String(row[cols.client] ?? '').trim()
    if (!site && cols.site >= 0) site = String(row[cols.site] ?? '').trim()

    const date = parseDateVal(row[cols.date])
    const valeur = parseNumericVal(row[cols.resultat])
    if (!date || valeur === null) continue

    mesures.push({
      parametre,
      unite: cols.unite >= 0 ? String(row[cols.unite] ?? '').trim() : '',
      date,
      valeur,
    })
  }

  if (mesures.length === 0) {
    throw new Error('Aucune mesure quantifiée exploitable trouvée dans le fichier DiPLABO.')
  }
  return { mesures, clientNom, site }
}

// ─── API publique ────────────────────────────────────────────────────────────────

/** Première passe : extrait client / site / années disponibles pour l'UI. */
export async function loadSyntheseMetadata(file: File): Promise<SyntheseMetadata> {
  const { mesures, clientNom, site } = readMesures(await file.arrayBuffer())
  const annees = [...new Set(mesures.map((m) => m.date.getFullYear()))].sort((a, b) => b - a)
  return { clientNom, site, annees }
}

/** Deuxième passe : calcule les statistiques pour l'année cible. */
export async function processSyntheseData(
  file: File,
  annee: number,
  milieu: string,
): Promise<SyntheseResultData> {
  const { mesures, clientNom, site } = readMesures(await file.arrayBuffer())

  const currentYear = mesures.filter((m) => m.date.getFullYear() === annee)
  const prevYear = mesures.filter((m) => m.date.getFullYear() === annee - 1)
  if (currentYear.length === 0) {
    throw new Error(`Aucune mesure pour l'année ${annee}.`)
  }

  const parametres = [...new Set(currentYear.map((m) => m.parametre))].sort()
  const stats: ParamStat[] = []

  for (const parametre of parametres) {
    const paramData = currentYear.filter((m) => m.parametre === parametre)
    const valeurs = paramData.map((m) => m.valeur)
    const moyenne = round2(mean(valeurs))

    // Tendance vs N-1
    let tendance: Tendance = 'stable'
    const prevValeurs = prevYear.filter((m) => m.parametre === parametre).map((m) => m.valeur)
    if (prevValeurs.length > 0) {
      const prevMean = mean(prevValeurs)
      if (prevMean > 0) {
        const variation = ((moyenne - prevMean) / prevMean) * 100
        if (variation > 10) tendance = 'hausse'
        else if (variation < -10) tendance = 'baisse'
      }
    }

    // Historique : 1 moyenne par année
    const historique: Record<string, number> = {}
    const allParam = mesures.filter((m) => m.parametre === parametre)
    const years = [...new Set(allParam.map((m) => m.date.getFullYear()))].sort()
    for (const year of years) {
      const yearVals = allParam.filter((m) => m.date.getFullYear() === year).map((m) => m.valeur)
      if (yearVals.length > 0) historique[String(year)] = round2(mean(yearVals))
    }

    stats.push({
      parametre,
      unite: paramData[0].unite,
      n: valeurs.length,
      moyenne,
      min: round2(Math.min(...valeurs)),
      max: round2(Math.max(...valeurs)),
      seuil: null, // DiPLABO ne fournit pas de seuil réglementaire
      seuil_type: null,
      depassements: 0,
      tendance,
      famille: familleFor(parametre),
      historique,
    })
  }

  return { clientNom, site, milieu, stats }
}
