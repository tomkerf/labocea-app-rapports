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
  syncedAt: number // timestamp ms
}

export class LaboceaDB extends Dexie {
  interventions!: Table<Intervention, string>
  blobs!: Table<BlobRecord, string>
  equipements!: Table<EquipementLocal, string>

  constructor() {
    super('labocea-rapports')
    this.version(1).stores({
      interventions:
        '&meta.id, meta.typeFiche, meta.statut, meta.updatedAt, meta.createdAt, identification.client, identification.site, identification.operateur',
      blobs: '&key',
    })
    this.version(2).stores({
      interventions:
        '&meta.id, meta.typeFiche, meta.statut, meta.updatedAt, meta.createdAt, identification.client, identification.site, identification.operateur',
      blobs: '&key',
      equipements: '&id, categorie, nom',
    })
  }
}

export const db = new LaboceaDB()
