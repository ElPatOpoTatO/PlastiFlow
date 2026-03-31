import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/database'
import type { Material } from '../types'

const ahora = () => new Date().toISOString().split('T')[0]

export function useMateriales(perfilId: string | null) {
  return useLiveQuery<Material[]>(
    () => perfilId
      ? db.materiales.where('perfilId').equals(perfilId).sortBy('nombre')
      : Promise.resolve([]),
    [perfilId]
  ) ?? []
}

export function useMaterial(id: string | undefined) {
  return useLiveQuery<Material | undefined>(
    () => id ? db.materiales.get(id) : Promise.resolve(undefined),
    [id]
  )
}

export async function crearMaterial(
  data: Omit<Material, 'id' | 'fechaCreacion' | 'fechaModificacion'>
): Promise<string> {
  const id = uuidv4()
  const fecha = ahora()
  await db.materiales.add({ ...data, id, fechaCreacion: fecha, fechaModificacion: fecha })
  return id
}

export async function actualizarMaterial(
  id: string,
  data: Partial<Omit<Material, 'id' | 'perfilId' | 'fechaCreacion'>>
): Promise<void> {
  await db.materiales.update(id, { ...data, fechaModificacion: ahora() })
}

export async function eliminarMaterial(id: string): Promise<void> {
  await db.materiales.delete(id)
}
