/**
 * Sync tuyaux PMC v2 → Dexie local.
 * Lecture seule — ne modifie jamais Firestore.
 */
import { collection, getDocs } from 'firebase/firestore'
import { useLiveQuery } from 'dexie-react-hooks'
import { firestore } from '../lib/firebase'
import { db, type TuyauLocal } from './db'

const SYNC_TTL_MS = 6 * 60 * 60 * 1000 // 6 h

/** Synchronise la collection `tuyaux` depuis Firestore vers Dexie. */
export async function syncTuyaux(force = false): Promise<void> {
  try {
    if (!force) {
      const last = await db.tuyaux.orderBy('syncedAt').last()
      if (last && Date.now() - last.syncedAt < SYNC_TTL_MS) return
    }
    const snap = await getDocs(collection(firestore, 'tuyaux'))
    const now = Date.now()
    const records: TuyauLocal[] = snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        refLabo: data.refLabo ?? '',
        materiau: data.materiau ?? '',
        annee: data.annee ?? 0,
        objet: data.objet ?? '',
        materiel: data.materiel ?? '',
        fournisseur: data.fournisseur ?? '',
        syncedAt: now,
      }
    })
    await db.tuyaux.bulkPut(records)
    // Supprime les tuyaux retirés de Firestore
    const remoteIds = new Set(records.map((r) => r.id))
    const localIds = (await db.tuyaux.toCollection().primaryKeys()) as string[]
    const toDelete = localIds.filter((id) => !remoteIds.has(id))
    if (toDelete.length) await db.tuyaux.bulkDelete(toDelete)
  } catch (e) {
    console.warn('[syncTuyaux] Échec sync — utilisation du cache local', e)
  }
}

/** Hook React — tous les tuyaux, triés par année desc puis refLabo. */
export function useAllTuyaux() {
  return useLiveQuery(
    () => db.tuyaux.orderBy('annee').reverse().toArray(),
    [],
    [] as TuyauLocal[],
  )
}

/** Formate un tuyau en label lisible pour l'autocomplete. */
export function tuyauLabel(t: TuyauLocal): string {
  return t.refLabo
}
