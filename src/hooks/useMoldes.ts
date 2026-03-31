import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/database'
import type { Molde } from '../types'

const ahora = () => new Date().toISOString().split('T')[0]

export function useMoldes(perfilId: string | null) {
  return useLiveQuery<Molde[]>(
    () => perfilId
      ? db.moldes.where('perfilId').equals(perfilId).sortBy('nombre')
      : Promise.resolve([]),
    [perfilId]
  ) ?? []
}

export function useMolde(id: string | undefined) {
  return useLiveQuery<Molde | undefined>(
    () => id ? db.moldes.get(id) : Promise.resolve(undefined),
    [id]
  )
}

export async function crearMolde(
  data: Omit<Molde, 'id' | 'fechaCreacion' | 'fechaModificacion'>
): Promise<string> {
  const id = uuidv4()
  const fecha = ahora()
  await db.moldes.add({ ...data, id, fechaCreacion: fecha, fechaModificacion: fecha })
  return id
}

export async function actualizarMolde(
  id: string,
  data: Partial<Omit<Molde, 'id' | 'perfilId' | 'fechaCreacion'>>
): Promise<void> {
  await db.moldes.update(id, { ...data, fechaModificacion: ahora() })
}

export async function eliminarMolde(id: string): Promise<void> {
  await db.moldes.delete(id)
}
