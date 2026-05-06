/**
 * Sync techniciens (users) PMC v2 → Dexie local.
 * Lecture seule — ne modifie jamais Firestore.
 */
import { collection, getDocs } from 'firebase/firestore'
import { useLiveQuery } from 'dexie-react-hooks'
import { firestore } from '../lib/firebase'
import { db, type TechnicienLocal } from './db'

const SYNC_TTL_MS = 6 * 60 * 60 * 1000 // 6 h

/** Synchronise la collection `users` depuis Firestore vers Dexie. */
export async function syncTechniciens(force = false): Promise<void> {
  try {
    if (!force) {
      const last = await db.techniciens.orderBy('syncedAt').last()
      if (last && Date.now() - last.syncedAt < SYNC_TTL_MS) return
    }
    const snap = await getDocs(collection(firestore, 'users'))
    const now = Date.now()
    const records: TechnicienLocal[] = snap.docs
      .map((d) => {
        const data = d.data()
        return {
          id: d.id,
          initiales: data.initiales ?? '',
          prenom: data.prenom ?? '',
          nom: data.nom ?? '',
          syncedAt: now,
        }
      })
      .filter((t) => t.initiales.length > 0)
    await db.techniciens.bulkPut(records)
    const remoteIds = new Set(records.map((r) => r.id))
    const localIds = (await db.techniciens.toCollection().primaryKeys()) as string[]
    const toDelete = localIds.filter((id) => !remoteIds.has(id))
    if (toDelete.length) await db.techniciens.bulkDelete(toDelete)
  } catch (e) {
    console.warn('[syncTechniciens] Échec sync', e)
  }
}

/** Hook React — retourne les initiales des techniciens triées (sans doublons). */
export function useTechnicienInitiales(): string[] {
  return (useLiveQuery(
    () => db.techniciens.orderBy('initiales').toArray().then((ts) => [
      ...new Set(ts.map((t) => t.initiales)),
    ]),
    [],
    [] as string[],
  ) ?? []) as string[]
}
