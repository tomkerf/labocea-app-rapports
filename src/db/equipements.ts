/**
 * Sync équipements PMC v2 → Dexie local.
 * Lecture seule — ne modifie jamais Firestore.
 */
import { collection, getDocs } from 'firebase/firestore'
import { useLiveQuery } from 'dexie-react-hooks'
import { firestore } from '../lib/firebase'
import { db, type EquipementLocal } from './db'

const SYNC_TTL_MS = 6 * 60 * 60 * 1000 // 6 h

/** Synchronise la collection `equipements` depuis Firestore vers Dexie.
 *  N'exécute rien si la dernière sync date de moins de 6 h. */
export async function syncEquipements(force = false): Promise<void> {
  try {
    if (!force) {
      const last = await db.equipements.orderBy('syncedAt').last()
      if (last && Date.now() - last.syncedAt < SYNC_TTL_MS) {
        // Migration : si les flacons n'ont pas de champ poids, forcer resync
        const flacon = await db.equipements.where('categorie').equals('flacon').first()
        if (!flacon || flacon.poids !== undefined) return
      }
    }
    const snap = await getDocs(collection(firestore, 'equipements'))
    const now = Date.now()
    const records: EquipementLocal[] = snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        nom: data.nom ?? '',
        marque: data.marque ?? '',
        modele: data.modele ?? '',
        numSerie: data.numSerie ?? '',
        categorie: data.categorie ?? 'autre',
        etat: data.etat ?? 'operationnel',
        poids: data.poids ?? undefined,
        syncedAt: now,
      }
    }).filter((e) => e.etat !== 'hors_service')
    await db.equipements.bulkPut(records)
    // Supprime les équipements retirés de Firestore
    const remoteIds = new Set(records.map((r) => r.id))
    const localIds = await db.equipements.toCollection().primaryKeys() as string[]
    const toDelete = localIds.filter((id) => !remoteIds.has(id))
    if (toDelete.length) await db.equipements.bulkDelete(toDelete)
  } catch (e) {
    console.warn('[syncEquipements] Échec sync — utilisation du cache local', e)
  }
}

/** Hook React — retourne les équipements d'une catégorie depuis Dexie. */
export function useEquipementsByCategorie(categorie: string | string[]) {
  const categories = Array.isArray(categorie) ? categorie : [categorie]
  return useLiveQuery(
    () => db.equipements
      .where('categorie').anyOf(categories)
      .sortBy('nom'),
    [categories.join(',')],
    [] as EquipementLocal[],
  )
}

/** Hook React — cherche un équipement par son nom exact (pour auto-fill). */
export function useEquipementByNom(nom: string | undefined): EquipementLocal | undefined {
  return useLiveQuery(
    () => nom ? db.equipements.where('nom').equals(nom).first() : Promise.resolve(undefined),
    [nom],
  ) as EquipementLocal | undefined
}

/** Parse une chaîne de poids PMC v2 (ex: "6,900 kg" ou "0.570 kg") en nombre. */
export function parsePoids(poids: string | undefined): number | null {
  if (!poids) return null
  const n = parseFloat(poids.replace(',', '.').replace(/[^\d.]/g, ''))
  return isNaN(n) ? null : n
}

/** Hook React — tous les équipements. */
export function useAllEquipements() {
  return useLiveQuery(
    () => db.equipements.orderBy('nom').toArray(),
    [],
    [] as EquipementLocal[],
  )
}

/** Formate un équipement en label lisible pour l'autocomplete. */
export function equipementLabel(e: EquipementLocal): string {
  return e.nom
}
