import { collection, getDocs } from 'firebase/firestore'
import { useLiveQuery } from 'dexie-react-hooks'
import { firestore } from '../lib/firebase'
import { db, type ClientLocal } from './db'

const SYNC_TTL_MS = 6 * 60 * 60 * 1000

export async function syncClients(force = false): Promise<void> {
  try {
    if (!force) {
      const last = await db.clients.orderBy('syncedAt').last()
      if (last && Date.now() - last.syncedAt < SYNC_TTL_MS) return
    }
    const snap = await getDocs(collection(firestore, 'clients-v2'))
    const now = Date.now()
    const records: ClientLocal[] = snap.docs.map((d) => ({
      id: d.id,
      nom: d.data().nom ?? '',
      syncedAt: now,
    })).filter((c) => c.nom.length > 0)
    await db.clients.bulkPut(records)
    const remoteIds = new Set(records.map((r) => r.id))
    const localIds = (await db.clients.toCollection().primaryKeys()) as string[]
    const toDelete = localIds.filter((id) => !remoteIds.has(id))
    if (toDelete.length) await db.clients.bulkDelete(toDelete)
  } catch (e) {
    console.warn('[syncClients] Échec sync', e)
  }
}

export function useClientNoms(): string[] {
  return (useLiveQuery(
    () => db.clients.orderBy('nom').toArray().then((cs) => cs.map((c) => c.nom)),
    [],
    [] as string[],
  ) ?? []) as string[]
}
