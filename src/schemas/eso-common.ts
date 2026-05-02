import { z } from 'zod'

/**
 * Sous-schémas partagés entre ESO (ENV) et ESO-SSP.
 * Source : PENV-SU-0114 V6 (fiches FD T90-523-3 et NF X 31-615).
 */

const numNullable = z.number().nullable().optional()
const strOpt = z.string().trim().optional().default('')
const boolOpt = z.boolean().optional().default(false)

/* ------- Description de l'ouvrage (commune aux deux variantes) ------- */
export const EtatMargelle = z.enum(['bon', 'degrade', 'absent', 'nc'])
export const TypeRepere = z.enum(['haut_tube', 'fourreau', 'margelle', 'autre'])

export const DescriptionOuvrageSchema = z.object({
  etatMargelle: EtatMargelle.optional(),
  diametreInterieurMm: numNullable,
  // Zone crépinée
  crepinemDeM: numNullable,   // profondeur haut crépine (m)
  crepinemAM: numNullable,    // profondeur bas crépine (m)
  hauteurZoneCrepineeM: numNullable,
  crepineNC: boolOpt,         // case NC
  // Repère
  typeRepere: TypeRepere.optional(),
  typeRepereAutre: strOpt,
  hauteurRepere_solM: numNullable, // hauteur du repère par rapport au sol (m)
  // Mesures
  profondeurMesureeP_M: numNullable,    // P = profondeur fond ouvrage (m)
  toitPiezoAvantPurgeN_M: numNullable,  // N = niveau eau avant purge (m/repère)
  hauteurColonneEauH_M: numNullable,    // H = P - N (calculé ou saisi)
  rabattementMaxR_M: numNullable,       // R = rabattement max possible
  volumeColonneEauVc_L: numNullable,    // Vc = H × π × (D/2)² (L)
})

/* ------- Métrologie commune ------- */
export const MetrologieEsoCommonSchema = z.object({
  referencePompe: strOpt,
  referenceTuyau: strOpt,
  referenceSonde: strOpt,
  referenceChronometreSonde: strOpt, // référence chronomètre
})

/* ------- Suivi physico-chimique (tableau pendant la purge) ------- */
export const MesurePurgeEsoSchema = z.object({
  tempsPurge: strOpt,          // durée écoulée (HH:MM ou min)
  tempC: numNullable,
  pH: numNullable,
  conductivite25UsCm: numNullable,
  toitPiezoPurgeM: numNullable, // niveau eau pendant purge (m/repère)
  debitLMin: numNullable,
})
export type MesurePurgeEso = z.infer<typeof MesurePurgeEsoSchema>

export const SuiviPhysicoChimiqueSchema = z.object({
  mesures: z.array(MesurePurgeEsoSchema).default([]),
})

/* ------- Indices organoleptiques (pendant purge + prélèvement) ------- */
export const IndicesOrganoSchema = z.object({
  couleur: strOpt,
  limpidite: strOpt,
  odeur: strOpt,
})

export const ObservationsEsoSchema = z.object({
  realimentation: z.enum(['bonne', 'moyenne', 'mauvaise', 'assechement']).optional(),
  indicesPurge: IndicesOrganoSchema.partial().default({}),
  indicesPrelevement: IndicesOrganoSchema.partial().default({}),
  autresObservations: strOpt,
})

/* ------- Paramètres physico-chimiques de fin de pompage ------- */
export const ParamsFinPompageSchema = z.object({
  tempC: numNullable,
  pH: numNullable,
  conductivite25UsCm: numNullable,
  // Codes appareils
  codeAppPareilPH: strOpt,
  codeAppPareilTemp: strOpt,
  codeAppPareilCond: strOpt,
})
