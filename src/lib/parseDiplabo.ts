/**
 * Parser export DiPLABO (.xls / .xlsx)
 *
 * Format réel DiPLABO :
 *   - Lignes 0–N : bloc de métadonnées (SECTEUR, DEMANDEUR, client, PERIODE…)
 *   - Ligne N+1  : en-têtes de colonnes (contient "PARAMETRE")
 *   - Lignes N+2+ : données analytiques (1 ligne par paramètre par échantillon)
 *
 * Colonnes utiles :
 *   Dossier | Client | Adresse | Id Ech | N° Ech LABOCEA | Site de prélèvement
 *   PROFIL | PARAMETRE | Norme | Méthode | Date Analyse | RESULTAT | Unité
 */
import * as XLSX from 'xlsx'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LigneDiplabo {
  parametre: string
  methode: string
  cofrac: string
  unite: string
  lq: string
  /** Résultat brut par point : ex { "CCPC - Point n° 2": "78" } */
  resultats: Record<string, string>
}

export interface ParsedDiplabo {
  /** Noms des points de prélèvement dans l'ordre de première apparition */
  points: string[]
  /** Lignes du tableau (1 par paramètre unique) */
  lignes: LigneDiplabo[]
  /** Méta-données extraites du fichier */
  meta: {
    client: string
    preleveur: string
    site: string
    dossier: string
    datePrelevement: string
    dateValidation: string
  }
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

/**
 * Parse un fichier DiPLABO XLS/XLSX et retourne un objet structuré.
 * Supporte le format avec bloc de métadonnées en début de fichier.
 */
export async function parseDiplaboFile(file: File): Promise<ParsedDiplabo> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false })
  const sheetName = wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]

  // Lire en mode tableau brut (header: 1) pour pouvoir scanner les lignes
  const rawRows = XLSX.utils.sheet_to_json<string[]>(ws, {
    header: 1,
    raw: false,
    defval: '',
  })

  if (rawRows.length === 0) throw new Error('Fichier DiPLABO vide ou format non reconnu')

  // ── Trouver la ligne d'en-têtes (celle qui contient "PARAMETRE") ──
  let headerRowIdx = -1
  for (let i = 0; i < rawRows.length; i++) {
    if (rawRows[i].some((cell) => String(cell).trim() === 'PARAMETRE')) {
      headerRowIdx = i
      break
    }
  }

  if (headerRowIdx === -1) {
    throw new Error(
      'Format DiPLABO non reconnu : colonne "PARAMETRE" introuvable.\n' +
      'Vérifiez que le fichier est bien un export DiPLABO de type "Résultats demandeur".'
    )
  }

  // ── Construire la map nom→index depuis la ligne d'en-têtes ──
  const headers = rawRows[headerRowIdx].map((h) => String(h).trim())

  function col(name: string): number {
    const idx = headers.indexOf(name)
    return idx  // -1 si absent (géré à l'usage)
  }

  const iDossier  = col('Dossier')
  const iClient   = col('Client')
  const iSite     = col('Site de prélèvement')
  const iIdEch    = col('Id Ech')
  const iParam    = col('PARAMETRE')
  const iMethode  = col('Méthode')
  const iDate     = col('Date Analyse')
  const iResultat = col('RESULTAT')
  const iUnite    = col('Unité')

  if (iParam === -1 || iResultat === -1) {
    throw new Error('Colonnes PARAMETRE ou RESULTAT introuvables dans le fichier DiPLABO')
  }

  // ── Lignes de données (après l'en-tête, ignorer les lignes vides) ──
  const dataRows = rawRows
    .slice(headerRowIdx + 1)
    .filter((row) => row.some((c) => String(c).trim() !== ''))

  if (dataRows.length === 0) {
    throw new Error('Aucune ligne de données trouvée dans le fichier DiPLABO')
  }

  // ── Méta depuis la première ligne de données ──
  const first = dataRows[0]
  const meta: ParsedDiplabo['meta'] = {
    client:          iClient  >= 0 ? String(first[iClient]  ?? '').trim() : '',
    preleveur:       '',  // absent du format DiPLABO résultats
    site:            iSite    >= 0 ? String(first[iSite]    ?? '').trim() : '',
    dossier:         iDossier >= 0 ? String(first[iDossier] ?? '').trim() : '',
    datePrelevement: iDate    >= 0 ? String(first[iDate]    ?? '').trim() : '',
    dateValidation:  '',
  }

  // ── Pivot long → large : 1 ligne par paramètre, 1 colonne par point ──
  const pointsSet  = new Set<string>()
  const lignesMap  = new Map<
    string,
    { parametre: string; methode: string; cofrac: string; unite: string; lq: string; resultats: Record<string, string> }
  >()

  for (const row of dataRows) {
    const parametre = String(row[iParam] ?? '').trim()
    if (!parametre) continue

    // Identifiant du point (Id Ech) — fallback "Point 1" si absent
    const point   = iIdEch >= 0 ? String(row[iIdEch] ?? '').trim() || 'Point 1' : 'Point 1'
    const methode = iMethode >= 0 ? String(row[iMethode] ?? '').trim() : ''
    const unite   = iUnite   >= 0 ? String(row[iUnite]   ?? '').trim() : ''
    const resultat = formatResultat(String(row[iResultat] ?? '').trim())

    // Clé unique : paramètre + méthode (certains paramètres ont plusieurs méthodes)
    const key = `${parametre}||${methode}`
    pointsSet.add(point)

    if (!lignesMap.has(key)) {
      lignesMap.set(key, { parametre, methode, cofrac: '', unite, lq: '', resultats: {} })
    }
    const ligne = lignesMap.get(key)!
    // En cas de doublon sur le même point, on garde la première valeur
    if (!ligne.resultats[point]) {
      ligne.resultats[point] = resultat
    }
  }

  const points = [...pointsSet]
  const lignes = [...lignesMap.values()]

  if (lignes.length === 0) {
    throw new Error('Aucun paramètre analytique trouvé dans le fichier DiPLABO')
  }

  return { points, lignes, meta }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalise un résultat DiPLABO :
 * - Vide → "—"
 * - Déjà au format "< X" → laissé tel quel
 * - Valeur numérique → telle quelle
 */
function formatResultat(resultat: string): string {
  if (!resultat) return '—'
  return resultat
}
