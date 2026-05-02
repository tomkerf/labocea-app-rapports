import { z } from 'zod'
import {
  DescriptionOuvrageSchema,
  MetrologieEsoCommonSchema,
  SuiviPhysicoChimiqueSchema,
  ParamsFinPompageSchema,
  ObservationsEsoSchema,
} from './eso-common'

/* ============================================================================
   PENV-SU-0114 — Eaux souterraines · Suivi environnemental
   Méthode : FD T 90-523-3
   ============================================================================ */

const numNullable = z.number().nullable().optional()
const strOpt = z.string().trim().optional().default('')
const boolOpt = z.boolean().optional().default(false)

/* ------- Type de station (spécifique ENV) ------- */
export const TypeStation = z.enum([
  'non_equipe',    // ouvrage non équipé d'une pompe
  'equipe',        // ouvrage équipé d'une pompe à demeure
  'source',
])

/* ------- Purge ENV ------- */
export const MaterielPurgeEnv = z.enum([
  'pompe_immergee_12v',
  'preleveur_jetable',
  'pompe_a_demeure',
])

export const PurgeEnvSchema = z.object({
  materielUtilise: MaterielPurgeEnv.optional(),
  positionPompeM: numNullable,
  positionPompeNC: boolOpt,
  debitLMin: numNullable,
  toitPiezoFinPurgeM: numNullable,  // niveau eau fin de purge
  rabattementDebutFinM: numNullable,
  volumePurgeL: numNullable,
  volumePurge_Vc: numNullable,      // ratio volume purgé / Vc
  respectCritere3Vc: z.boolean().nullable().optional(),
  motifNonRespect: z.enum([
    'ouvrage_peu_productif',
    'assechement',
    'forage_tres_profond',
    'puits',
    'autre',
  ]).optional(),
  motifNonRespectAutre: strOpt,
  motifPurgeNonRealisee: strOpt,   // si purge non réalisée
})

/* ------- Prélèvement ENV ------- */
export const LieuPrelevementEnv = z.enum([
  'pompe',
  'source',
  'autre',
])

export const MaterielPrelevEnv = z.enum([
  'pompe_immergee_12v',
  'preleveur_jetable',
  'pompe_a_demeure',
])

export const PrelevementEnvSchema = z.object({
  materielUtilise: MaterielPrelevEnv.optional(),
  lieuPrelevement: LieuPrelevementEnv.optional(),
  lieuPrelevementAutre: strOpt,    // ex : main/lest/perche
  positionPompeM: numNullable,
  positionPompeNC: boolOpt,
  debitLMin: numNullable,
  // Pour source
  positionSourceEmergenceM: numNullable,
  positionSourceNC: boolOpt,
  debitSourceLs: numNullable,      // débit source (L/s)
  filtrationSurSite: z.enum(['oui', 'non', 'sans_objet']).optional(),
})

/* ------- Paramètres fin pompage ENV (+ salinité, O2) ------- */
export const ParamsFinPompageEnvSchema = ParamsFinPompageSchema.extend({
  saliniteg_kg: numNullable,
  o2TypeMesure: z.enum(['optique', 'electrochimique']).optional(),
  o2MgL: numNullable,
  o2PourcentSat: numNullable,
  pressionAtmhPa: numNullable,
  codeAppPareilO2: strOpt,
})

/* ============================================================================
   Schéma fiche ESO ENV complet
   ============================================================================ */

export const FicheEsoSchema = z.object({
  // Identification complémentaire
  nomOuvrage: strOpt,
  typeStation: TypeStation.optional(),
  heureDebutPurge: strOpt,
  heureFinPurge: strOpt,
  heureDebutPrelevement: strOpt,
  heureFinPrelevement: strOpt,
  // Sections
  metrologie: MetrologieEsoCommonSchema.partial().default({}),
  descriptionOuvrage: DescriptionOuvrageSchema.partial().default({}),
  volumeMinPurgerL: numNullable,       // 3 × Vc
  purge: PurgeEnvSchema.partial().default({}),
  prelevement: PrelevementEnvSchema.partial().default({}),
  suiviPhysicoChimique: SuiviPhysicoChimiqueSchema.default({ mesures: [] }),
  paramsFinPompage: ParamsFinPompageEnvSchema.partial().default({}),
  observations: ObservationsEsoSchema.partial().default({}),
})

export type FicheEso = z.infer<typeof FicheEsoSchema>
