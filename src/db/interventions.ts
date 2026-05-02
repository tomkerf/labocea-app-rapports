import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { type Intervention, newPautoIntervention, newEsoIntervention, newEsoSspIntervention, newEsuIntervention } from '../schemas/intervention'
import type { TypeFiche } from '../schemas/common'

/* ----------------------------- Lectures ----------------------------- */

export function useInterventions() {
  return useLiveQuery(
    () => db.interventions.orderBy('meta.updatedAt').reverse().toArray(),
    [],
    [] as Intervention[],
  )
}

export function useIntervention(id: string | undefined): Intervention | undefined {
  return useLiveQuery(
    () => (id ? db.interventions.get(id) : Promise.resolve(undefined)),
    [id],
  ) as Intervention | undefined
}

/* ----------------------------- Écritures ----------------------------- */

export async function createIntervention(typeFiche: TypeFiche): Promise<Intervention> {
  let intervention: Intervention
  switch (typeFiche) {
    case 'PAUTO':
      intervention = newPautoIntervention()
      break
    case 'ESO':
      intervention = newEsoIntervention()
      break
    case 'ESO_SSP':
      intervention = newEsoSspIntervention()
      break
    case 'ESU':
      intervention = newEsuIntervention()
      break
    default:
      throw new Error(`Type de fiche non encore implémenté : ${typeFiche}`)
  }
  await db.interventions.add(intervention)
  return intervention
}

export async function saveIntervention(intervention: Intervention): Promise<void> {
  const updated: Intervention = {
    ...intervention,
    meta: {
      ...intervention.meta,
      updatedAt: new Date().toISOString(),
    },
  }
  await db.interventions.put(updated)
}

export async function deleteIntervention(id: string): Promise<void> {
  await db.interventions.delete(id)
}

export async function setStatut(
  id: string,
  statut: Intervention['meta']['statut'],
): Promise<void> {
  const inter = await db.interventions.get(id)
  if (!inter) return
  inter.meta.statut = statut
  inter.meta.updatedAt = new Date().toISOString()
  await db.interventions.put(inter)
}
