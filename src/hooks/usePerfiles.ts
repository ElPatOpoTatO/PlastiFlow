// ============================================================
// PlastiFlow — Hook: Gestión de Perfiles
// ============================================================

import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/database'
import type { Perfil, ConfiguracionPerfil, Molde, OrdenProduccion } from '../types'

const CONFIG_DEFAULT: ConfiguracionPerfil = {
  diasAlertaEntrega: 3,
  alertaEntregaActiva: true,
  alertaProyeccionActiva: true,
  alertaInventarioActiva: true,
  zonaHoraria: 'America/Mexico_City',
  moneda: 'MXN',
  horasLaboralesDia: 8,
  diasHabilMes: 22,
}

function ahora(): string {
  return new Date().toISOString().split('T')[0]
}

// Lista reactiva de todos los perfiles
export function useListaPerfiles() {
  return useLiveQuery(() => db.perfiles.orderBy('nombre').toArray(), []) ?? []
}

// Crear un perfil nuevo
export async function crearPerfil(nombre: string, descripcion = ''): Promise<string> {
  const id = uuidv4()
  const fecha = ahora()
  const perfil: Perfil = {
    id,
    nombre: nombre.trim(),
    descripcion: descripcion.trim(),
    fechaCreacion: fecha,
    ultimaModificacion: fecha,
    esRespaldo: false,
    configuracion: { ...CONFIG_DEFAULT },
  }
  await db.perfiles.add(perfil)
  return id
}

// Actualizar datos de un perfil
export async function actualizarPerfil(
  id: string,
  cambios: Partial<Omit<Perfil, 'id' | 'fechaCreacion'>>
): Promise<void> {
  await db.perfiles.update(id, {
    ...cambios,
    ultimaModificacion: ahora(),
  })
}

// Duplicar un perfil con todas sus entidades
export async function duplicarPerfil(perfilId: string): Promise<string> {
  const nuevoId = uuidv4()
  const fecha = ahora()

  // Cargar datos del perfil original
  const [perfil, maquinas, moldes, clientes, materiales, ordenes] = await Promise.all([
    db.perfiles.get(perfilId),
    db.maquinas.where('perfilId').equals(perfilId).toArray(),
    db.moldes.where('perfilId').equals(perfilId).toArray(),
    db.clientes.where('perfilId').equals(perfilId).toArray(),
    db.materiales.where('perfilId').equals(perfilId).toArray(),
    db.ordenes.where('perfilId').equals(perfilId).toArray(),
  ])

  if (!perfil) throw new Error('Perfil no encontrado')

  // Mapa de IDs viejos → nuevos para reasignar referencias
  const idMap: Record<string, string> = {}

  const reasignar = <T extends { id: string; perfilId: string }>(
    entidades: T[]
  ): T[] =>
    entidades.map(e => {
      const nuevoEntidadId = uuidv4()
      idMap[e.id] = nuevoEntidadId
      return { ...e, id: nuevoEntidadId, perfilId: nuevoId }
    })

  const nuevasMaquinas = reasignar(maquinas)
  const nuevosMoldes = (reasignar(moldes) as Molde[]).map((m: Molde) => ({
    ...m,
    materialesCompatibles: m.materialesCompatibles.map((mid: string) => idMap[mid] ?? mid),
  }))
  const nuevosClientes = reasignar(clientes)
  const nuevosMateriales = reasignar(materiales)
  const nuevasOrdenes = (reasignar(ordenes) as OrdenProduccion[]).map((o: OrdenProduccion) => ({
    ...o,
    moldeId: idMap[o.moldeId] ?? o.moldeId,
    maquinaId: idMap[o.maquinaId] ?? o.maquinaId,
    materialId: idMap[o.materialId] ?? o.materialId,
    clienteId: idMap[o.clienteId] ?? o.clienteId,
    fechaCreacion: fecha,
    fechaModificacion: fecha,
  }))

  const nuevoPerfil: Perfil = {
    ...perfil,
    id: nuevoId,
    nombre: `${perfil.nombre} (copia)`,
    fechaCreacion: fecha,
    ultimaModificacion: fecha,
    esRespaldo: false,
  }

  await db.transaction('rw', [db.perfiles, db.maquinas, db.moldes, db.clientes, db.materiales, db.ordenes], async () => {
    await db.perfiles.add(nuevoPerfil)
    if (nuevasMaquinas.length)  await db.maquinas.bulkAdd(nuevasMaquinas)
    if (nuevosMoldes.length)    await db.moldes.bulkAdd(nuevosMoldes)
    if (nuevosClientes.length)  await db.clientes.bulkAdd(nuevosClientes)
    if (nuevosMateriales.length) await db.materiales.bulkAdd(nuevosMateriales)
    if (nuevasOrdenes.length)   await db.ordenes.bulkAdd(nuevasOrdenes)
  })

  return nuevoId
}

// Configuración reactiva del perfil activo (con fallback a defaults)
export function useConfiguracion(perfilActivoId: string | null): ConfiguracionPerfil {
  return useLiveQuery(
    async () => {
      if (!perfilActivoId) return CONFIG_DEFAULT
      const perfil = await db.perfiles.get(perfilActivoId)
      return perfil ? { ...CONFIG_DEFAULT, ...perfil.configuracion } : CONFIG_DEFAULT
    },
    [perfilActivoId],
    CONFIG_DEFAULT
  )
}

// Actualizar solo la configuración de un perfil
export async function actualizarConfiguracion(
  perfilId: string,
  config: Partial<ConfiguracionPerfil>
): Promise<void> {
  const perfil = await db.perfiles.get(perfilId)
  if (!perfil) return
  await db.perfiles.update(perfilId, {
    configuracion: { ...CONFIG_DEFAULT, ...perfil.configuracion, ...config },
    ultimaModificacion: new Date().toISOString().split('T')[0],
  })
}

// Eliminar un perfil con todas sus entidades en cascada
export async function eliminarPerfil(perfilId: string): Promise<void> {
  await db.transaction('rw', [db.perfiles, db.maquinas, db.moldes, db.clientes, db.materiales, db.ordenes, db.alertas], async () => {
    await Promise.all([
      db.perfiles.delete(perfilId),
      db.maquinas.where('perfilId').equals(perfilId).delete(),
      db.moldes.where('perfilId').equals(perfilId).delete(),
      db.clientes.where('perfilId').equals(perfilId).delete(),
      db.materiales.where('perfilId').equals(perfilId).delete(),
      db.ordenes.where('perfilId').equals(perfilId).delete(),
      db.alertas.where('perfilId').equals(perfilId).delete(),
    ])
  })
}
