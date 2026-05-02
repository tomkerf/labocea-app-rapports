import { z } from 'zod'
import {
  IdentificationSchema,
  ObservationsSchema,
  ReceptionLaboSchema,
  StatutIntervention,
  TypeFiche,
  PieceJointeSchema,
} from './common'
import { FichePautoSchema } from './pauto'
import { FicheEsoSchema } from './eso'
import { FicheEsoSspSchema } from './eso-ssp'
import { FicheEsuSchema } from './esu'

/** Méta sur l'intervention (id, dates, statut, version, type) */
const MetaSchema = z.object({
  id: z.string(),
  typeFiche: TypeFiche,
  statut: StatutIntervention.default('brouillon'),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int().default(1),
})

/** Schéma "fiche" discriminé par typeFiche */
const FicheSchema = z.discriminatedUnion('typeFiche', [
  z.object({ typeFiche: z.literal('PAUTO'),   data: FichePautoSchema }),
  z.object({ typeFiche: z.literal('ESO'),     data: FicheEsoSchema }),
  z.object({ typeFiche: z.literal('ESO_SSP'), data: FicheEsoSspSchema }),
  z.object({ typeFiche: z.literal('ESU'),     data: FicheEsuSchema }),
])

/** Intervention complète */
export const InterventionSchema = z.object({
  meta: MetaSchema,
  identification: IdentificationSchema.partial(),
  fiche: FicheSchema,
  observations: ObservationsSchema.partial().default({}),
  receptionLabo: ReceptionLaboSchema.partial().default({}),
  pieces: z.array(PieceJointeSchema).default([]),
})

export type Intervention = z.infer<typeof InterventionSchema>

const identificationVierge = (now: string) => ({
  client: '',
  numConventionDevis: '',
  site: '',
  operateur: '',
  dateDebut: now,
  dateFin: '',
  natureEchantillon: '',
})

/** Génère une intervention vierge typée PAUTO */
export function newPautoIntervention(): Intervention {
  const now = new Date().toISOString()
  return {
    meta: { id: cryptoRandomId(), typeFiche: 'PAUTO', statut: 'brouillon', createdAt: now, updatedAt: now, version: 1 },
    identification: identificationVierge(now),
    fiche: {
      typeFiche: 'PAUTO',
      data: {
        localisation: {},
        dispositifJaugeur: { type: 'aucun' },
        debitmetre: {},
        metrologie: {},
        echantillonneur: {},
        verifVitesseAspiration: { debut: [{}, {}, {}], fin: [{}, {}, {}] },
        verifVolumeUnitaire: { debut: {}, fin: {} },
        volumeGlobal: {},
        tempEnceinte: {},
        mesuresInSitu: {},
        constitution: {},
      },
    },
    observations: {},
    receptionLabo: {},
    pieces: [],
  }
}

/** Génère une intervention vierge typée ESO — Suivi environnemental (FD T 90-523-3) */
export function newEsoIntervention(): Intervention {
  const now = new Date().toISOString()
  return {
    meta: { id: cryptoRandomId(), typeFiche: 'ESO', statut: 'brouillon', createdAt: now, updatedAt: now, version: 1 },
    identification: identificationVierge(now),
    fiche: {
      typeFiche: 'ESO',
      data: {
        nomOuvrage: '',
        typeStation: undefined,
        heureDebutPurge: '',
        heureFinPurge: '',
        heureDebutPrelevement: '',
        heureFinPrelevement: '',
        metrologie: {},
        descriptionOuvrage: {},
        volumeMinPurgerL: null,
        purge: {},
        prelevement: {},
        suiviPhysicoChimique: { mesures: [] },
        paramsFinPompage: {},
        observations: {},
      },
    },
    observations: {},
    receptionLabo: {},
    pieces: [],
  }
}

/** Génère une intervention vierge typée ESO_SSP — Sites et sols pollués (NF X 31-615) */
export function newEsoSspIntervention(): Intervention {
  const now = new Date().toISOString()
  return {
    meta: { id: cryptoRandomId(), typeFiche: 'ESO_SSP', statut: 'brouillon', createdAt: now, updatedAt: now, version: 1 },
    identification: identificationVierge(now),
    fiche: {
      typeFiche: 'ESO_SSP',
      data: {
        nomOuvrage: '',
        heureDebutPurge: '',
        heureFinPurge: '',
        heureDebutPrelevement: '',
        heureFinPrelevement: '',
        metrologie: {},
        descriptionOuvrage: {},
        volumeMinPurger_L: null,
        purge: {},
        prelevement: {},
        suiviPhysicoChimique: { mesures: [] },
        paramsFinPompage: {},
        observations: {},
      },
    },
    observations: {},
    receptionLabo: {},
    pieces: [],
  }
}

/** Génère une intervention vierge typée ESU (PENV-SU-0117) */
export function newEsuIntervention(): Intervention {
  const now = new Date().toISOString()
  return {
    meta: { id: cryptoRandomId(), typeFiche: 'ESU', statut: 'brouillon', createdAt: now, updatedAt: now, version: 1 },
    identification: identificationVierge(now),
    fiche: {
      typeFiche: 'ESU',
      data: {
        localisation: {},
        materiel: {},
        modePrelevement: {},
        mesuresInSitu: {},
        metrologie: {},
      },
    },
    observations: {},
    receptionLabo: {},
    pieces: [],
  }
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'id-' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}
