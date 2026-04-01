import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/database'
import type { OrdenProduccion, EstadoOrden } from '../types'

const ahora = () => new Date().toISOString().split('T')[0]

export function useOrdenes(perfilId: string | null) {
  return useLiveQuery<OrdenProduccion[]>(
    () => perfilId
      ? db.ordenes.where('perfilId').equals(perfilId).sortBy('fechaEntrega')
      : Promise.resolve([]),
    [perfilId]
  ) ?? []
}

export function useOrden(id: string | undefined) {
  return useLiveQuery<OrdenProduccion | undefined>(
    () => id ? db.ordenes.get(id) : Promise.resolve(undefined),
    [id]
  )
}

export async function generarFolio(perfilId: string): Promise<string> {
  const ordenes = await db.ordenes.where('perfilId').equals(perfilId).toArray()
  const maxNum = ordenes.reduce((max: number, o: OrdenProduccion) => {
    const match = o.folio.match(/(\d+)$/)
    return match ? Math.max(max, parseInt(match[1])) : max
  }, 0)
  return `ORD-${String(maxNum + 1).padStart(4, '0')}`
}

export async function crearOrden(
  data: Omit<OrdenProduccion, 'id' | 'folio' | 'fechaCreacion' | 'fechaModificacion'>
): Promise<string> {
  const id = uuidv4()
  const fecha = ahora()
  const folio = await generarFolio(data.perfilId)
  await db.ordenes.add({ ...data, id, folio, fechaCreacion: fecha, fechaModificacion: fecha })
  return id
}

export async function actualizarOrden(
  id: string,
  data: Partial<Omit<OrdenProduccion, 'id' | 'perfilId' | 'folio' | 'fechaCreacion'>>
): Promise<void> {
  await db.ordenes.update(id, { ...data, fechaModificacion: ahora() })
}

export async function cambiarEstadoOrden(id: string, estado: EstadoOrden): Promise<void> {
  await db.ordenes.update(id, { estado, fechaModificacion: ahora() })
}

export async function eliminarOrden(id: string): Promise<void> {
  await db.ordenes.delete(id)
}
