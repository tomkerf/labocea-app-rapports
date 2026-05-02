import { z } from 'zod'
import { Conformite } from './common'

/* ============================================================================
   PENV-SU-0117 — Prélèvement en eaux superficielles
   (cours d'eau, plan d'eau, eaux côtières/estuariennes, eaux résiduaires)
   Méthode : NF EN ISO 5667-1 / NF EN ISO 5667-3 / FD T90-523-3
   ============================================================================ */

const numNullable = z.number().nullable().optional()
const strOpt = z.string().trim().optional().default('')
const boolOpt = z.boolean().optional().default(false)

/* ------- Type de milieu aquatique ------- */
export const TypeMilieuEsu = z.enum([
  'cours_eau',          // rivière, fleuve, ruisseau, canal
  'plan_eau',           // lac, étang, retenue
  'estuaire',           // zone de mélange eau douce/eau de mer
  'eau_cotiere',        // eau de mer, lagon
  'eau_residuaire_urb', // STEP, réseau EU
  'eau_residuaire_ind', // effluent industriel non canalisé
  'autre',
])
export type TypeMilieuEsu = z.infer<typeof TypeMilieuEsu>

export const ConditionsHydro = z.enum([
  'etiage',
  'hautes_eaux',
  'crue',
  'conditions_normales',
  'inconnues',
])

/* ------- Localisation du point ------- */
export const LocalisationEsuSchema = z.object({
  identificationExacte: strOpt,
  typeMilieu: TypeMilieuEsu.optional(),
  typeMilieuAutre: strOpt,
  conditionsHydro: ConditionsHydro.optional(),
  // Description du point
  largeurMilieuM: numNullable,       // largeur estimée du cours d'eau (m)
  profondeurMilieuM: numNullable,    // profondeur au point de prélèvement (m)
  vitesseEcoulementMs: numNullable,  // vitesse d'écoulement estimée (m/s)
  profondeurPrelevementM: numNullable, // profondeur effective de prise d'eau (m)
  // Aspect visuel
  aspectVisuel: strOpt,              // couleur, mousse, turbidité visuelle…
  odeur: strOpt,
})

/* ------- Matériel de prélèvement ------- */
export const TypeMaterielEsu = z.enum([
  'seau',
  'flacon_direct',
  'pompe_peristaltique',
  'pompe_immergee',
  'kumba',
  'preleveur_automatique',
  'autre',
])

export const MateriauMaterielEsu = z.enum([
  'inox',
  'pvc',
  'pehd',
  'verre',
  'autre',
])

export const MaterielEsuSchema = z.object({
  type: TypeMaterielEsu.optional(),
  typeAutre: strOpt,
  materiau: MateriauMaterielEsu.optional(),
  materiauAutre: strOpt,
  nettoyageAvant: boolOpt,
  rinçageAvant: boolOpt,       // rinçage avec l'eau du milieu avant prélèvement
})

/* ------- Mode de prélèvement ------- */
export const ModePrelEsu = z.enum([
  'ponctuel',              // un seul prélèvement instantané
  'composite_manuel',      // plusieurs prises manuelles regroupées
  'composite_asservi',     // composite sur volume ou sur débit (avec préleveur auto)
])

export const ModePrelevementEsuSchema = z.object({
  mode: ModePrelEsu.optional(),
  // Pour composite manuel
  nombrePrises: numNullable,          // nombre de prises élémentaires
  intervalleMin: numNullable,         // intervalle entre prises (min)
  volumeParPriseML: numNullable,      // volume par prise (mL)
  // Pour composite asservi
  asservissementType: z.enum(['volume', 'debit', 'temps']).optional(),
  asservissementValeur: strOpt,       // ex : "1 L tous les 100 m³"
  // Flacon
  flaconMateriau: z.enum(['pe', 'verre', 'autre']).optional(),
  volumeTotalMl: numNullable,
  homogenisation: z.enum(['mecanique', 'manuelle']).optional(),
  conservationAcide: boolOpt,
  conservationFroid: boolOpt,
})

/* ------- Mesures in situ ------- */
export const MesuresInSituEsuSchema = z.object({
  codeAppareilSondes: strOpt,
  tempC: numNullable,
  pH: numNullable,
  pHTempMesureC: numNullable,
  conductiviteUsCm: numNullable,
  o2DissousMgL: numNullable,
  o2DissouspPct: numNullable,
  redoxMv: numNullable,
  turbiditeFTU: numNullable,
  // Spécifique eaux côtières / estuaires
  salinitePpt: numNullable,          // salinité (‰ ou PSU)
  // Débit (cours d'eau)
  debitM3S: numNullable,             // débit au point (m³/s) si mesuré
  conformite: Conformite.optional(),
})

/* ------- Métrologie ------- */
export const MetrologieEsuSchema = z.object({
  codeSondeMultiparametre: strOpt,
  codeFlacon: strOpt,
  codeMaterielPrelevement: strOpt,
  codeChronometre: strOpt,
})

/* ============================================================================
   Schéma fiche ESU complet
   ============================================================================ */

export const FicheEsuSchema = z.object({
  localisation: LocalisationEsuSchema.partial().default({}),
  materiel: MaterielEsuSchema.partial().default({}),
  modePrelevement: ModePrelevementEsuSchema.partial().default({}),
  mesuresInSitu: MesuresInSituEsuSchema.partial().default({}),
  metrologie: MetrologieEsuSchema.partial().default({}),
})

export type FicheEsu = z.infer<typeof FicheEsuSchema>
