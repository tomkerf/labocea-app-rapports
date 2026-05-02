import { z } from 'zod'

/* ----------------------------- Énumérations ----------------------------- */

export const TypeFiche = z.enum(['PAUTO', 'ESO', 'ESO_SSP', 'ESU'])
export type TypeFiche = z.infer<typeof TypeFiche>

export const StatutIntervention = z.enum([
  'brouillon',
  'en_cours',
  'finalise',
  'reception_labo',
])
export type StatutIntervention = z.infer<typeof StatutIntervention>

export const ConditionsMeteo = z.enum([
  'sec_ensoleille',
  'sec_couvert',
  'humide',
  'pluie_fine',
  'pluie_forte',
  'orage',
  'neige',
  'gel',
])
export type ConditionsMeteo = z.infer<typeof ConditionsMeteo>

export const Conformite = z.enum(['conforme', 'non_conforme', 'sans_objet'])
export type Conformite = z.infer<typeof Conformite>

/* ----------------------------- Sous-schémas ----------------------------- */

/** Identification commune à toutes les fiches */
export const IdentificationSchema = z.object({
  client: z.string().trim().min(1, 'Client requis'),
  numConventionDevis: z.string().trim().optional().default(''),
  site: z.string().trim().min(1, 'Site requis'),
  operateur: z.string().trim().min(1, 'Opérateur requis'),
  dateDebut: z.string().min(1, 'Date début requise'), // ISO datetime
  dateFin: z.string().optional().default(''), // ISO datetime
  natureEchantillon: z.string().trim().optional().default(''),
})
export type Identification = z.infer<typeof IdentificationSchema>

/** Coordonnées GPS (capturées via geolocation API) */
export const CoordsSchema = z.object({
  x: z.number().nullable().optional(),
  y: z.number().nullable().optional(),
  precision: z.number().nullable().optional(),
  capturedAt: z.string().optional(), // ISO datetime
})
export type Coords = z.infer<typeof CoordsSchema>

/** Bloc d'observations + indices organoleptiques (commun à plusieurs fiches) */
export const ObservationsSchema = z.object({
  meteo: ConditionsMeteo.optional(),
  changementPointMotif: z.string().trim().optional().default(''),
  clientPrevenuLe: z.string().optional().default(''),
  observations: z.string().trim().optional().default(''),
  coords: CoordsSchema.optional(),
})
export type Observations = z.infer<typeof ObservationsSchema>

/** Réception au laboratoire */
export const ReceptionLaboSchema = z.object({
  dateReception: z.string().optional().default(''),
  heureReception: z.string().optional().default(''),
  tempReception: z.number().nullable().optional(),
  tempEnceinte: z.number().nullable().optional(),
  tempEnceinteConformite: Conformite.optional(),
  remarques: z.string().trim().optional().default(''),
})
export type ReceptionLabo = z.infer<typeof ReceptionLaboSchema>

/** Photo / pièce jointe stockée localement */
export const PieceJointeSchema = z.object({
  id: z.string(),
  nom: z.string(),
  mimeType: z.string(),
  taille: z.number(),
  blobKey: z.string(), // clé dans la table 'pieces_blobs'
  dateAjout: z.string(),
  legende: z.string().optional().default(''),
})
export type PieceJointe = z.infer<typeof PieceJointeSchema>
