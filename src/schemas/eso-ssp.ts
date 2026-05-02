import { z } from 'zod'
import {
  DescriptionOuvrageSchema,
  MetrologieEsoCommonSchema,
  SuiviPhysicoChimiqueSchema,
  ParamsFinPompageSchema,
  ObservationsEsoSchema,
} from './eso-common'

/* ============================================================================
   PENV-SU-0114 — Eaux souterraines · Sites et sols pollués
   Méthode : NF X 31-615
   ============================================================================ */

const numNullable = z.number().nullable().optional()
const strOpt = z.string().trim().optional().default('')

/* ------- Description ouvrage SSP (étend le schéma commun) ------- */
export const DescriptionOuvrageSspSchema = DescriptionOuvrageSchema.extend({
  // Volumes additionnels SSP
  volumeMassifFiltrantVm_L: numNullable,  // Vm (L)
  volumeEauOuvrageVp_L: numNullable,      // Vp = Vc + Vm (L)
  // Phases
  phaseFlottante: z.boolean().nullable().optional(),
  phaseFlottanteEpaisseurM: numNullable,
  phasePlongeante: z.boolean().nullable().optional(),
  phasePlongeanteEpaisseurM: numNullable,
})

/* ------- Purge SSP ------- */
export const MaterielPurgeSsp = z.enum([
  'pompe_immergee_12v',
  'preleveur_jetable',
])

export const CritereFinPurgeSsp = z.enum([
  'stabilisation_params_in_situ',
  'volume_3_5_vp',
])

export const GestionEauxPurge = z.enum([
  'sol',
  'reseau_eu_ep',
  'stockage',
  'autre',
])

export const PurgeSspSchema = z.object({
  materielUtilise: MaterielPurgeSsp.optional(),
  positionPompeM: numNullable,
  debitLMin: numNullable,
  toitPiezoFinPurgeM: numNullable,
  rabattementDebutFinM: numNullable,
  volumePurgeL: numNullable,
  volumePurge_Vp: numNullable,       // ratio volume purgé / Vp
  critereFinPurge: CritereFinPurgeSsp.optional(),
  gestionEauxPurge: GestionEauxPurge.optional(),
  gestionEauxPurgeAutre: strOpt,
  motifPurgeNonRealisee: strOpt,
})

/* ------- Prélèvement SSP ------- */
export const MaterielPrelevSsp = z.enum([
  'pompe_immergee_12v',
  'preleveur_jetable',
])

export const PrelevementSspSchema = z.object({
  materielUtilise: MaterielPrelevSsp.optional(),
  positionPompeM: numNullable,
  debitLMin: numNullable,
  filtrationSurSite: z.enum(['oui', 'non', 'sans_objet']).optional(),
})

/* ============================================================================
   Schéma fiche ESO-SSP complet
   ============================================================================ */

export const FicheEsoSspSchema = z.object({
  // Identification complémentaire
  nomOuvrage: strOpt,
  heureDebutPurge: strOpt,
  heureFinPurge: strOpt,
  heureDebutPrelevement: strOpt,
  heureFinPrelevement: strOpt,
  // Sections
  metrologie: MetrologieEsoCommonSchema.partial().default({}),
  descriptionOuvrage: DescriptionOuvrageSspSchema.partial().default({}),
  volumeMinPurger_L: numNullable,  // 3 à 5 × Vp
  purge: PurgeSspSchema.partial().default({}),
  prelevement: PrelevementSspSchema.partial().default({}),
  suiviPhysicoChimique: SuiviPhysicoChimiqueSchema.default({ mesures: [] }),
  paramsFinPompage: ParamsFinPompageSchema.partial().default({}),
  observations: ObservationsEsoSchema.partial().default({}),
})

export type FicheEsoSsp = z.infer<typeof FicheEsoSspSchema>
