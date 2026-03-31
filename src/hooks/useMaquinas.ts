import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/database'
import type { Maquina } from '../types'

const ahora = () => new Date().toISOString().split('T')[0]

export function useMaquinas(perfilId: string | null) {
  return useLiveQuery<Maquina[]>(
    () => perfilId
      ? db.maquinas.where('perfilId').equals(perfilId).sortBy('nombre')
      : Promise.resolve([]),
    [perfilId]
  ) ?? []
}

export function useMaquina(id: string | undefined) {
  return useLiveQuery<Maquina | undefined>(
    () => id ? db.maquinas.get(id) : Promise.resolve(undefined),
    [id]
  )
}

export async function crearMaquina(
  data: Omit<Maquina, 'id' | 'fechaCreacion' | 'fechaModificacion'>
): Promise<string> {
  const id = uuidv4()
  const fecha = ahora()
  await db.maquinas.add({ ...data, id, fechaCreacion: fecha, fechaModificacion: fecha })
  return id
}

export async function actualizarMaquina(
  id: string,
  data: Partial<Omit<Maquina, 'id' | 'perfilId' | 'fechaCreacion'>>
): Promise<void> {
  await db.maquinas.update(id, { ...data, fechaModificacion: ahora() })
}

export async function eliminarMaquina(id: string): Promise<void> {
  await db.maquinas.delete(id)
}
