import { z } from 'zod'
import { Conformite } from './common'

/* ============================================================================
   PENV-SU-0120 — Prélèvement automatique avec asservissement au débit
   Méthode : FD T90-523-2
   Bilan 24h, 1 dispositif unique par fiche
   ============================================================================ */

const numNullable = z.number().nullable().optional()
const strOpt = z.string().trim().optional().default('')
const boolOpt = z.boolean().optional().default(false)

/* ------- Localisation du point d'échantillonnage ------- */
export const LocalisationSchema = z.object({
  identificationExacte: strOpt,
  natureEffluent: z.enum(['brut', 'pretraite']).optional(),
})

/* ------- Dispositif de mesure de débit ------- */
export const TypeDispositifJaugeur = z.enum([
  'canal_venturi',
  'seuil_deversoir',
  'manchon_deversoir',
  'aucun',
])

export const TypeSeuilDeversoir = z.enum(['rectangulaire', 'triangulaire'])
export const ProprieteEquipement = z.enum(['client', 'labocea'])
export const FormeManchon = z.enum(['circulaire', 'triangulaire'])

export const DispositifJaugeurSchema = z.object({
  type: TypeDispositifJaugeur.default('aucun'),
  // Canal Venturi
  venturiModele: strOpt,
  venturiHmaxCm: numNullable,
  // Seuil déversoir
  seuilType: TypeSeuilDeversoir.optional(),
  seuilProprietaire: ProprieteEquipement.optional(),
  seuilCaracteristiquesCm: strOpt,
  // Manchon déversoir
  manchonForme: FormeManchon.optional(),
  manchonDiametreMm: numNullable,
})

/* ------- Débitmètre ------- */
export const TypeDebitmetre = z.enum([
  'bulle_a_bulle',
  'sonde_us',
  'h_v',
  'electromagnetique',
  'autre',
])

export const OrientationCanalisation = z.enum(['horizontale', 'verticale', 'oblique'])

export const DebitmetreSchema = z.object({
  type: TypeDebitmetre.optional(),
  typeAutre: strOpt,
  proprietaire: ProprieteEquipement.optional(),

  positionnementDistanceCm: numNullable,
  positionnementConformite: Conformite.optional(),

  // Bulle à bulle
  etalonnageDRepereCm: numNullable,
  etalonnageHRegleCm: numNullable,
  etalonnageDmoinsHCm: numNullable,

  // Vérification hauteurs (Venturi/Déversoir) — début bilan / fin bilan
  verifVenturi: z.object({
    debut: z.object({
      hauteurEprouvetteZeroCm: numNullable,
      hauteurEprouvette50pcCm: numNullable,
      hauteurEprouvetteHmaxCm: numNullable,
      hauteurLueZeroCm: numNullable,
      hauteurLue50pcCm: numNullable,
      hauteurLueHmaxCm: numNullable,
      ecartConformite: Conformite.optional(),
    }).partial(),
    fin: z.object({
      hauteurEprouvetteZeroCm: numNullable,
      hauteurEprouvette50pcCm: numNullable,
      hauteurEprouvetteHmaxCm: numNullable,
      hauteurLueZeroCm: numNullable,
      hauteurLue50pcCm: numNullable,
      hauteurLueHmaxCm: numNullable,
      ecartConformite: Conformite.optional(),
    }).partial(),
  }).partial().optional(),

  lectureDirecteMotif: strOpt,
  lectureDirecte: z.object({
    debutHauteurReglet: numNullable,
    debutHauteurLue: numNullable,
    finHauteurReglet: numNullable,
    finHauteurLue: numNullable,
    conformite: Conformite.optional(),
  }).partial().optional(),

  zeroDansAirManchon: boolOpt,

  // Vérification H/V
  verifHV: z.object({
    debutHauteurReglet: numNullable,
    debutHauteurLue: numNullable,
    finHauteurReglet: numNullable,
    finHauteurLue: numNullable,
    conformite: Conformite.optional(),
  }).partial().optional(),

  // Électromagnétique
  electromagnetique: z.object({
    fextMm: numNullable,
    lAmontCm: numNullable,
    lAvalCm: numNullable,
    natureConduite: strOpt,
    epaisseurConduiteMm: numNullable,
    orientation: OrientationCanalisation.optional(),
    distanceCapteursCm: numNullable,
    positionnementConformite: Conformite.optional(),
  }).partial().optional(),
})

/* ------- Métrologie : codes équipements utilisés ------- */
export const MetrologieSchema = z.object({
  codeDebitmetre: strOpt,
  codePreleveur: strOpt,
  codeEprouvette: strOpt,
  codeReglet: strOpt,
  codeRegletEprouvette: strOpt,
  codeTuyauPompe: strOpt,
  codeTuyauPrelevement: strOpt,
  codeChronometre: strOpt,
  codeBalance: strOpt,
  codeFlacon: strOpt,
  codeTomkey: strOpt,
})

/* ------- Échantillonneur automatique ------- */
export const TypePreleveur = z.enum(['monoflacon', 'multiflacon'])
export const Alimentation = z.enum(['secteur', 'batterie'])
export const MateriauTuyau = z.enum(['pvc', 'teflon'])
export const MateriauFlacon = z.enum(['pe', 'verre'])
export const PositionnementPriseEau = z.enum(['amont_dispositif_jaugeur', 'autre'])
export const ProfondeurPriseEau = z.enum(['un_tiers_sous_surface', 'autre'])

export const EchantillonneurAutoSchema = z.object({
  typePreleveur: TypePreleveur.optional(),
  refrigere: boolOpt,
  alimentation: Alimentation.optional(),
  // Pompage : peristaltique d'office d'après la fiche
  tuyauMateriau: MateriauTuyau.optional(),
  tuyauDiametreMm: numNullable,
  tuyauLongueurM: numNullable,
  flaconMateriau: MateriauFlacon.optional(),
  nettoyageAvant: boolOpt,
  purgeAvant: boolOpt,
  utilisationCrepine: boolOpt,
  positionnementPriseEau: PositionnementPriseEau.optional(),
  positionnementAutre: strOpt,
  profondeurPriseEau: ProfondeurPriseEau.optional(),
  profondeurAutre: strOpt,
  // Asservissement : volume mL tous les X litres
  asservissementVolumeMl: numNullable,
  asservissementParLitres: numNullable,
})

/* ------- Vérifications de l'échantillonneur ------- */
export const EssaiVitesse = z.object({
  tempsS: numNullable,
  vitesseMs: numNullable,
})

export const VerifVitesseAspirationSchema = z.object({
  debut: z.array(EssaiVitesse).length(3).default([{}, {}, {}]),
  fin: z.array(EssaiVitesse).length(3).default([{}, {}, {}]),
}).partial()

export const VerifVolumeUnitaireSchema = z.object({
  volumeDemandeMl: numNullable,
  debut: z.object({
    essai1Ml: numNullable,
    essai2Ml: numNullable,
    essai3Ml: numNullable,
  }).partial(),
  fin: z.object({
    essai1Ml: numNullable,
    essai2Ml: numNullable,
    essai3Ml: numNullable,
  }).partial(),
}).partial()

export const VolumeGlobalSchema = z.object({
  volumeUnitaireMoyenMl: numNullable,
  nombrePrelevementsRealises: numNullable,
  volumeGlobalTheoriqueL: numNullable,
  poidsFlaconDebutKg: numNullable,
  poidsFlaconFinKg: numNullable,
  poidsEchantillonFinKg: numNullable,
  conformite: Conformite.optional(),

  volumeRejeteM3: numNullable,
  nombrePrelevementsAttendus: numNullable,
  ratioRealisesAttendusOk: z.boolean().nullable().optional(),
}).partial()

export const TempEnceinteSchema = z.object({
  debutC: numNullable,
  finC: numNullable,
  conformite: Conformite.optional(),
}).partial()

/* ------- Mesures in situ ------- */
export const TypeMesure = z.enum(['ponctuelle_in_situ', 'ponctuelle_sur_site', 'sous_echantillon', 'en_continu'])

export const MesuresInSituSchema = z.object({
  typeMesure: TypeMesure.optional(),
  tempEchantillonC: numNullable,
  tempEffluentC: numNullable,
  pH: numNullable,
  pHTempMesureC: numNullable,
  conductiviteUsCm: numNullable,
  codeAppareilSondes: strOpt,
}).partial()

/* ------- Constitution / transport ------- */
export const HomogenisationSchema = z.enum(['mecanique', 'manuelle'])
export const ConstitutionSchema = z.object({
  homogenisation: HomogenisationSchema.optional(),
})

/* ============================================================================
   Schéma fiche PAUTO complet
   ============================================================================ */

export const FichePautoSchema = z.object({
  localisation: LocalisationSchema.partial().default({}),
  dispositifJaugeur: DispositifJaugeurSchema.partial().default({ type: 'aucun' }),
  debitmetre: DebitmetreSchema.partial().default({}),
  metrologie: MetrologieSchema.partial().default({}),
  echantillonneur: EchantillonneurAutoSchema.partial().default({}),
  verifVitesseAspiration: VerifVitesseAspirationSchema.default({}),
  verifVolumeUnitaire: VerifVolumeUnitaireSchema.default({}),
  volumeGlobal: VolumeGlobalSchema.default({}),
  tempEnceinte: TempEnceinteSchema.default({}),
  mesuresInSitu: MesuresInSituSchema.default({}),
  constitution: ConstitutionSchema.partial().default({}),
})

export type FichePauto = z.infer<typeof FichePautoSchema>
