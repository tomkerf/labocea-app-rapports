/**
 * Calculs de conformité pour la fiche PAUTO PENV-SU-0120.
 * Source de vérité : seuils fixés par les méthodes/référentiels COFRAC.
 *
 * Convention :
 * - Une fonction renvoie un `Conformity` :
 *   - status: 'conforme' | 'non_conforme' | 'pending' (valeurs manquantes)
 *   - value:  valeur calculée principale (écart, ratio, moyenne…)
 *   - detail: texte humain pour affichage
 *
 * Toutes les entrées sont des nombres potentiellement absents (undefined / null / NaN).
 */

export type Status = 'conforme' | 'non_conforme' | 'pending'

export interface Conformity {
  status: Status
  value?: number
  detail?: string
}

const PENDING: Conformity = { status: 'pending', detail: 'Valeurs manquantes' }

function num(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : undefined
}

/* ──────────────────────────────────────────────────────────────────────────
   1) Écart hauteur Venturi/Déversoir : ±2 mm sur (hauteur éprouvette − hauteur lue)
   Pour chaque colonne : zéro, 50 % Hmax, Hmax. La fonction agrège la pire valeur.
   Les hauteurs sont saisies en cm, le seuil est en mm.
   ────────────────────────────────────────────────────────────────────────── */

export function ecartHauteur(eprouvetteCm?: number | null, lueCm?: number | null): number | undefined {
  const a = num(eprouvetteCm)
  const b = num(lueCm)
  if (a === undefined || b === undefined) return undefined
  return Math.abs(a - b) * 10 // cm → mm
}

export function conformiteVerifVenturi(
  bloc:
    | {
        hauteurEprouvetteZeroCm?: number | null
        hauteurEprouvette50pcCm?: number | null
        hauteurEprouvetteHmaxCm?: number | null
        hauteurLueZeroCm?: number | null
        hauteurLue50pcCm?: number | null
        hauteurLueHmaxCm?: number | null
      }
    | undefined,
): Conformity {
  if (!bloc) return PENDING
  const ecarts = [
    ecartHauteur(bloc.hauteurEprouvetteZeroCm, bloc.hauteurLueZeroCm),
    ecartHauteur(bloc.hauteurEprouvette50pcCm, bloc.hauteurLue50pcCm),
    ecartHauteur(bloc.hauteurEprouvetteHmaxCm, bloc.hauteurLueHmaxCm),
  ].filter((x): x is number => x !== undefined)
  if (ecarts.length === 0) return PENDING
  const max = Math.max(...ecarts)
  return {
    status: max <= 2 ? 'conforme' : 'non_conforme',
    value: max,
    detail: `Écart max : ${max.toFixed(1)} mm (seuil ±2 mm)`,
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   2) Lecture directe / Débitmètre H/V : ±3 mm sur (hauteur réglet − hauteur lue)
   ────────────────────────────────────────────────────────────────────────── */

export function conformiteEcart3mm(
  regletCm?: number | null,
  lueCm?: number | null,
): Conformity {
  const ecart = ecartHauteur(regletCm, lueCm)
  if (ecart === undefined) return PENDING
  return {
    status: ecart <= 3 ? 'conforme' : 'non_conforme',
    value: ecart,
    detail: `Écart : ${ecart.toFixed(1)} mm (seuil ±3 mm)`,
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   3) Vitesse d'aspiration : ≥ 0,5 m/s sur les 3 essais
   ────────────────────────────────────────────────────────────────────────── */

export function conformiteVitesseAspiration(
  essais: Array<{ vitesseMs?: number | null }> | undefined,
): Conformity {
  if (!essais || essais.length === 0) return PENDING
  const vitesses = essais.map((e) => num(e.vitesseMs)).filter((v): v is number => v !== undefined)
  if (vitesses.length === 0) return PENDING
  const min = Math.min(...vitesses)
  return {
    status: min >= 0.5 ? 'conforme' : 'non_conforme',
    value: min,
    detail: `Vitesse min : ${min.toFixed(2)} m/s (seuil ≥ 0,5 m/s)`,
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   4) Volume unitaire — fidélité ±5 % et justesse ±10 %
   - Moyenne = (essai1 + essai2 + essai3) / 3
   - Fidélité = (max − min) / moyenne × 100
   - Justesse = |moyenne − volumeDemandé| / volumeDemandé × 100
   ────────────────────────────────────────────────────────────────────────── */

export interface VolumeUnitaireStats {
  moyenne?: number
  fidelite?: number
  justesse?: number
  fideliteOk: Status
  justesseOk: Status
  status: Status // conforme si fidélité ET justesse OK, non_conforme si l'un des deux KO
}

export function statsVolumeUnitaire(
  essais: { essai1Ml?: number | null; essai2Ml?: number | null; essai3Ml?: number | null } | undefined,
  volumeDemandeMl?: number | null,
): VolumeUnitaireStats {
  if (!essais) return { fideliteOk: 'pending', justesseOk: 'pending', status: 'pending' }
  const v1 = num(essais.essai1Ml)
  const v2 = num(essais.essai2Ml)
  const v3 = num(essais.essai3Ml)
  const vDem = num(volumeDemandeMl)
  const present = [v1, v2, v3].filter((x): x is number => x !== undefined)
  if (present.length < 3) {
    return { fideliteOk: 'pending', justesseOk: 'pending', status: 'pending' }
  }
  const moyenne = (present[0] + present[1] + present[2]) / 3
  const max = Math.max(...present)
  const min = Math.min(...present)

  const fidelite = moyenne > 0 ? ((max - min) / moyenne) * 100 : undefined
  const justesse = vDem !== undefined && vDem > 0 ? (Math.abs(moyenne - vDem) / vDem) * 100 : undefined

  const fideliteOk: Status =
    fidelite === undefined ? 'pending' : fidelite <= 5 ? 'conforme' : 'non_conforme'
  const justesseOk: Status =
    justesse === undefined ? 'pending' : justesse <= 10 ? 'conforme' : 'non_conforme'

  let status: Status = 'pending'
  if (fideliteOk !== 'pending' && justesseOk !== 'pending') {
    status = fideliteOk === 'conforme' && justesseOk === 'conforme' ? 'conforme' : 'non_conforme'
  } else if (fideliteOk === 'non_conforme' || justesseOk === 'non_conforme') {
    status = 'non_conforme'
  }

  return { moyenne, fidelite, justesse, fideliteOk, justesseOk, status }
}

/* ──────────────────────────────────────────────────────────────────────────
   5) Volume global collecté — écart ≤ 10 % entre théorique et collecté
   - Volume collecté ≈ poidsEchantillonFin (kg) × 1 L/kg (eau ≈ 1 g/mL)
   - Écart % = |théorique − collecté| / théorique × 100
   ────────────────────────────────────────────────────────────────────────── */

export function conformiteVolumeGlobal(
  bloc:
    | {
        volumeGlobalTheoriqueL?: number | null
        poidsFlaconDebutKg?: number | null
        poidsFlaconFinKg?: number | null
        poidsEchantillonFinKg?: number | null
      }
    | undefined,
): Conformity & { volumeCollecteL?: number; ecartPct?: number } {
  if (!bloc) return PENDING
  const theo = num(bloc.volumeGlobalTheoriqueL)
  // Volume collecté : priorité au poids échantillon final, sinon delta poids flacon
  let collecte = num(bloc.poidsEchantillonFinKg)
  if (collecte === undefined) {
    const pd = num(bloc.poidsFlaconDebutKg)
    const pf = num(bloc.poidsFlaconFinKg)
    if (pd !== undefined && pf !== undefined) collecte = pf - pd
  }
  if (theo === undefined || collecte === undefined || theo <= 0) return PENDING
  const ecart = Math.abs(theo - collecte) / theo * 100
  return {
    status: ecart <= 10 ? 'conforme' : 'non_conforme',
    value: ecart,
    volumeCollecteL: collecte,
    ecartPct: ecart,
    detail: `Collecté ${collecte.toFixed(2)} L vs théorique ${theo.toFixed(2)} L · écart ${ecart.toFixed(1)} % (seuil 10 %)`,
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   6) Température enceinte : 5 ± 3 °C → [2 ; 8] °C
   On vérifie début ET fin de bilan séparément, le pire détermine le global.
   ────────────────────────────────────────────────────────────────────────── */

export function conformiteTempEnceinte(t?: number | null): Conformity {
  const v = num(t)
  if (v === undefined) return PENDING
  return {
    status: v >= 2 && v <= 8 ? 'conforme' : 'non_conforme',
    value: v,
    detail: `${v.toFixed(1)} °C (consigne 5 ± 3 °C)`,
  }
}

export function conformiteTempEnceinteGlobal(
  bloc: { debutC?: number | null; finC?: number | null } | undefined,
): Conformity {
  if (!bloc) return PENDING
  const cd = conformiteTempEnceinte(bloc.debutC)
  const cf = conformiteTempEnceinte(bloc.finC)
  if (cd.status === 'pending' && cf.status === 'pending') return PENDING
  const status: Status =
    cd.status === 'non_conforme' || cf.status === 'non_conforme'
      ? 'non_conforme'
      : cd.status === 'conforme' && cf.status === 'conforme'
        ? 'conforme'
        : 'pending'
  return {
    status,
    detail:
      `Début : ${cd.value !== undefined ? cd.value.toFixed(1) + ' °C' : '—'} · ` +
      `Fin : ${cf.value !== undefined ? cf.value.toFixed(1) + ' °C' : '—'} ` +
      `(consigne 5 ± 3 °C)`,
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   7) Ratio prélèvements réalisés / attendus : ≥ 95 %
   ────────────────────────────────────────────────────────────────────────── */

export function conformiteRatioPrelevements(
  realises?: number | null,
  attendus?: number | null,
): Conformity {
  const r = num(realises)
  const a = num(attendus)
  if (r === undefined || a === undefined || a <= 0) return PENDING
  const ratio = (r / a) * 100
  return {
    status: ratio >= 95 ? 'conforme' : 'non_conforme',
    value: ratio,
    detail: `${r} / ${a} prélèvements · ${ratio.toFixed(1)} % (seuil ≥ 95 %)`,
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   8) Positionnement débitmètre (Venturi 3-4 Hmax / déversoir 4 Hmax)
   - L'utilisateur saisit la distance et le Hmax. On vérifie que la distance
     est dans la plage attendue.
   - Pour le moment on garde une coche manuelle car le critère dépend du type
     de dispositif et c'est sujet à ajustement terrain.
   ────────────────────────────────────────────────────────────────────────── */

export function conformitePositionnementVenturi(
  distanceCm?: number | null,
  hmaxCm?: number | null,
): Conformity {
  const d = num(distanceCm)
  const h = num(hmaxCm)
  if (d === undefined || h === undefined || h <= 0) return PENDING
  const ratio = d / h
  return {
    status: ratio >= 3 && ratio <= 4 ? 'conforme' : 'non_conforme',
    value: ratio,
    detail: `Distance ${d} cm / Hmax ${h} cm = ${ratio.toFixed(2)} × Hmax (cible 3 à 4 × Hmax)`,
  }
}

export function conformitePositionnementDeversoir(
  distanceCm?: number | null,
  hmaxCm?: number | null,
): Conformity {
  const d = num(distanceCm)
  const h = num(hmaxCm)
  if (d === undefined || h === undefined || h <= 0) return PENDING
  const ratio = d / h
  return {
    status: ratio >= 3.5 && ratio <= 4.5 ? 'conforme' : 'non_conforme',
    value: ratio,
    detail: `Distance ${d} cm / Hmax ${h} cm = ${ratio.toFixed(2)} × Hmax (cible ≈ 4 × Hmax)`,
  }
}
