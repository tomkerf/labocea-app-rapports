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

export class LaboceaDB extends Dexie {
  interventions!: Table<Intervention, string>
  blobs!: Table<BlobRecord, string>

  constructor() {
    super('labocea-rapports')
    this.version(1).stores({
      // PK = meta.id, index sur les champs utiles pour filtrer/trier
      interventions:
        '&meta.id, meta.typeFiche, meta.statut, meta.updatedAt, meta.createdAt, identification.client, identification.site, identification.operateur',
      blobs: '&key',
    })
  }
}

export const db = new LaboceaDB()
