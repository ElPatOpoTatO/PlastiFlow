import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/database'
import type { Cliente } from '../types'

const ahora = () => new Date().toISOString().split('T')[0]

export function useClientes(perfilId: string | null) {
  return useLiveQuery<Cliente[]>(
    () => perfilId
      ? db.clientes.where('perfilId').equals(perfilId).sortBy('nombre')
      : Promise.resolve([]),
    [perfilId]
  ) ?? []
}

export function useCliente(id: string | undefined) {
  return useLiveQuery<Cliente | undefined>(
    () => id ? db.clientes.get(id) : Promise.resolve(undefined),
    [id]
  )
}

export async function crearCliente(
  data: Omit<Cliente, 'id' | 'fechaCreacion' | 'fechaModificacion'>
): Promise<string> {
  const id = uuidv4()
  const fecha = ahora()
  await db.clientes.add({ ...data, id, fechaCreacion: fecha, fechaModificacion: fecha })
  return id
}

export async function actualizarCliente(
  id: string,
  data: Partial<Omit<Cliente, 'id' | 'perfilId' | 'fechaCreacion'>>
): Promise<void> {
  await db.clientes.update(id, { ...data, fechaModificacion: ahora() })
}

export async function eliminarCliente(id: string): Promise<void> {
  await db.clientes.delete(id)
}
