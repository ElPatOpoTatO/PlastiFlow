// ============================================================
// PlastiFlow — Utilidades de Exportación e Importación de Perfiles
// ============================================================

import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/database'
import type { ArchivoPlastiflow, Perfil } from '../types'

// ----------------------------
// Exportar perfil como .plastiflow
// ----------------------------

export async function exportarPerfil(perfilId: string): Promise<void> {
  const [perfil, maquinas, moldes, clientes, materiales, ordenes] = await Promise.all([
    db.perfiles.get(perfilId),
    db.maquinas.where('perfilId').equals(perfilId).toArray(),
    db.moldes.where('perfilId').equals(perfilId).toArray(),
    db.clientes.where('perfilId').equals(perfilId).toArray(),
    db.materiales.where('perfilId').equals(perfilId).toArray(),
    db.ordenes.where('perfilId').equals(perfilId).toArray(),
  ])

  if (!perfil) throw new Error('Perfil no encontrado')

  // Actualizar ultimaModificacion antes de exportar
  const ahora = new Date().toISOString().split('T')[0]
  await db.perfiles.update(perfilId, { ultimaModificacion: ahora })

  const archivo: ArchivoPlastiflow = {
    version: '1.0',
    perfil: { ...perfil, ultimaModificacion: ahora },
    maquinas,
    moldes,
    clientes,
    materiales,
    ordenes,
    configuracion: perfil.configuracion,
  }

  const json = JSON.stringify(archivo, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const nombreArchivo = `${perfil.nombre.replace(/[^a-zA-Z0-9_\-\u00C0-\u024F]/g, '_')}.plastiflow`

  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ----------------------------
// Validar estructura de archivo .plastiflow
// ----------------------------

export function validarArchivoPlastiflow(data: unknown): data is ArchivoPlastiflow {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>

  if (typeof d['version'] !== 'string') return false

  // Validar perfil
  const perfil = d['perfil']
  if (!perfil || typeof perfil !== 'object') return false
  const p = perfil as Record<string, unknown>
  if (typeof p['id'] !== 'string' || !p['id']) return false
  if (typeof p['nombre'] !== 'string' || !p['nombre']) return false
  if (typeof p['fechaCreacion'] !== 'string') return false

  // Validar que las colecciones sean arrays
  const colecciones: (keyof ArchivoPlastiflow)[] = ['maquinas', 'moldes', 'clientes', 'materiales', 'ordenes']
  for (const col of colecciones) {
    if (!Array.isArray(d[col])) return false
  }

  // Validar configuracion
  if (!d['configuracion'] || typeof d['configuracion'] !== 'object') return false

  return true
}

// ----------------------------
// Importar perfil desde .plastiflow
// ----------------------------

export async function importarPerfil(
  archivo: File
): Promise<{ ok: boolean; error?: string; perfilId?: string }> {
  // Leer archivo
  const texto = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsText(archivo, 'utf-8')
  })

  // Parsear JSON
  let data: unknown
  try {
    data = JSON.parse(texto)
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido' }
  }

  // Validar estructura
  if (!validarArchivoPlastiflow(data)) {
    return { ok: false, error: 'El archivo no tiene la estructura de un perfil PlastiFlow válido' }
  }

  const nuevoPerfilId = uuidv4()
  const ahora = new Date().toISOString().split('T')[0]

  // Mapa de IDs viejos → nuevos
  const idMap: Record<string, string> = {}

  const reasignarIds = <T extends { id: string; perfilId: string }>(entidades: T[]): T[] =>
    entidades.map(e => {
      const nuevoId = uuidv4()
      idMap[e.id] = nuevoId
      return { ...e, id: nuevoId, perfilId: nuevoPerfilId }
    })

  const nuevasMaquinas  = reasignarIds(data.maquinas)
  const nuevosMateriales = reasignarIds(data.materiales)
  const nuevosClientes  = reasignarIds(data.clientes)

  // Moldes: reasignar materialesCompatibles
  const nuevosMoldes = reasignarIds(data.moldes).map(m => ({
    ...m,
    materialesCompatibles: m.materialesCompatibles.map((mid: string) => idMap[mid] ?? mid),
  }))

  // Órdenes: reasignar referencias
  const nuevasOrdenes = reasignarIds(data.ordenes).map(o => ({
    ...o,
    moldeId:    idMap[o.moldeId] ?? o.moldeId,
    maquinaId:  idMap[o.maquinaId] ?? o.maquinaId,
    materialId: idMap[o.materialId] ?? o.materialId,
    clienteId:  idMap[o.clienteId] ?? o.clienteId,
    fechaModificacion: ahora,
  }))

  const nuevoPerfil: Perfil = {
    ...data.perfil,
    id: nuevoPerfilId,
    nombre: data.perfil.nombre,
    ultimaModificacion: ahora,
    esRespaldo: false,
    configuracion: data.configuracion,
  }

  try {
    await db.transaction('rw', [db.perfiles, db.maquinas, db.moldes, db.clientes, db.materiales, db.ordenes], async () => {
      await db.perfiles.add(nuevoPerfil)
      if (nuevasMaquinas.length)   await db.maquinas.bulkAdd(nuevasMaquinas)
      if (nuevosMoldes.length)     await db.moldes.bulkAdd(nuevosMoldes)
      if (nuevosClientes.length)   await db.clientes.bulkAdd(nuevosClientes)
      if (nuevosMateriales.length) await db.materiales.bulkAdd(nuevosMateriales)
      if (nuevasOrdenes.length)    await db.ordenes.bulkAdd(nuevasOrdenes)
    })

    return { ok: true, perfilId: nuevoPerfilId }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido al importar'
    return { ok: false, error: `Error al guardar el perfil: ${msg}` }
  }
}
