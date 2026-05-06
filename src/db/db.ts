import Dexie, { type Table } from 'dexie'
import type { Intervention } from '../schemas/intervention'

/**
 * Base IndexedDB locale.
 * On stocke les interventions en JSON (objet typé) et les blobs (photos) à part.
 */
export interface BlobRecord {
  key: string // UUID
  blob: Blob
}

/** Équipement synchronisé depuis PMC v2 Firestore (lecture seule). */
export interface EquipementLocal {
  id: string
  nom: string
  marque: string
  modele: string
  numSerie: string
  categorie: string
  etat: string
  poids?: string  // ex: "6,900 kg" — spécifique aux flacons
  syncedAt: number // timestamp ms
}

/** Tuyau de prélèvement synchronisé depuis PMC v2 Firestore (lecture seule). */
export interface TuyauLocal {
  id: string
  refLabo: string    // ex : "Q25S1"
  materiau: string   // "SILICONE" | "TEFLON" | "VINYL (tricolair)"
  annee: number
  objet: string      // ex : "RSDE DZ", "SRA"
  materiel: string   // codes équipement associés (PLV07 / FLC10)
  fournisseur: string
  syncedAt: number
}

/** Client synchronisé depuis PMC v2 Firestore (lecture seule). */
export interface ClientLocal {
  id: string
  nom: string
  syncedAt: number
}

/** Technicien synchronisé depuis PMC v2 Firestore (lecture seule). */
export interface TechnicienLocal {
  id: string       // uid Firebase
  initiales: string
  prenom: string
  nom: string
  syncedAt: number
}

/** Valeurs limites d'émission (VLE) mémorisées par client (arrêté préfectoral). */
export interface VleConfig {
  /** Nom du client — clé primaire */
  clientNom: string
  /** Map paramètre → { vle, unite, vleCharge? } */
  params: Record<string, { vle: string; unite: string; vleCharge?: string }>
}

const INTERVENTIONS_STORE =
  '&meta.id, meta.typeFiche, meta.statut, meta.updatedAt, meta.createdAt, identification.client, identification.site, identification.operateur'

export class LaboceaDB extends Dexie {
  interventions!: Table<Intervention, string>
  blobs!: Table<BlobRecord, string>
  equipements!: Table<EquipementLocal, string>
  tuyaux!: Table<TuyauLocal, string>
  clients!: Table<ClientLocal, string>
  techniciens!: Table<TechnicienLocal, string>
  vleConfigs!: Table<VleConfig, string>

  constructor() {
    super('labocea-rapports')
    this.version(1).stores({
      interventions: INTERVENTIONS_STORE,
      blobs: '&key',
    })
    this.version(2).stores({
      interventions: INTERVENTIONS_STORE,
      blobs: '&key',
      equipements: '&id, categorie, nom',
    })
    this.version(3).stores({
      interventions: INTERVENTIONS_STORE,
      blobs: '&key',
      equipements: '&id, categorie, nom, syncedAt',
    })
    this.version(4).stores({
      interventions: INTERVENTIONS_STORE,
      blobs: '&key',
      equipements: '&id, categorie, nom, syncedAt',
      tuyaux: '&id, materiau, annee, syncedAt',
    })
    this.version(5).stores({
      interventions: INTERVENTIONS_STORE,
      blobs: '&key',
      equipements: '&id, categorie, nom, syncedAt',
      tuyaux: '&id, materiau, annee, syncedAt',
      clients: '&id, nom, syncedAt',
      techniciens: '&id, initiales, syncedAt',
    })
    this.version(6).stores({
      interventions: INTERVENTIONS_STORE,
      blobs: '&key',
      equipements: '&id, categorie, nom, syncedAt',
      tuyaux: '&id, materiau, annee, syncedAt',
      clients: '&id, nom, syncedAt',
      techniciens: '&id, initiales, syncedAt',
      vleConfigs: '&clientNom',
    })
  }
}

export const db = new LaboceaDB()
