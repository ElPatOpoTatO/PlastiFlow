// ============================================================
// PlastiFlow — Hook y lógica de Alertas
// ============================================================

import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/database'
import { calcularDatosOrden, formatearFecha } from '../utils/calculos'
import type {
  Alerta,
  TipoAlerta,
  FrecuenciaOrden,
  Molde,
  Material,
} from '../types'

// ----------------------------
// Helpers internos
// ----------------------------

function frecuenciaToDias(frecuencia: FrecuenciaOrden): number {
  const map: Record<FrecuenciaOrden, number> = {
    semanal:      7,
    quincenal:    15,
    mensual:      30,
    bimestral:    60,
    trimestral:   90,
    personalizado: 30,
  }
  return map[frecuencia]
}

/** Días transcurridos desde una fecha ISO (positivo = pasado, negativo = futuro). */
function diasDesdeHoy(isoFecha: string): number {
  const fecha = new Date(isoFecha)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  fecha.setHours(0, 0, 0, 0)
  return Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24))
}

/** Días que faltan hasta una fecha ISO (positivo = futuro, negativo = pasado). */
function diasHastaFecha(isoFecha: string): number {
  return -diasDesdeHoy(isoFecha)
}

// ----------------------------
// Generación de alertas
// ----------------------------

/**
 * Escanea todas las órdenes del perfil y sincroniza la tabla de alertas:
 * - Crea alertas nuevas cuando se detectan condiciones
 * - Elimina alertas cuya condición ya no aplica
 * - No duplica alertas existentes (deduplicación por tipo::ordenId)
 */
export async function generarAlertas(perfilId: string): Promise<void> {
  // 1. Cargar todo en paralelo
  const [perfil, ordenes, moldes, materiales, alertasExistentes] = await Promise.all([
    db.perfiles.get(perfilId),
    db.ordenes.where('perfilId').equals(perfilId).toArray(),
    db.moldes.where('perfilId').equals(perfilId).toArray(),
    db.materiales.where('perfilId').equals(perfilId).toArray(),
    db.alertas.where('perfilId').equals(perfilId).toArray(),
  ])

  if (!perfil) return

  const config = perfil.configuracion
  const moldeMap = new Map<string, Molde>(moldes.map(m => [m.id, m]))
  const materialMap = new Map<string, Material>(materiales.map(m => [m.id, m]))

  // 2. Mapa de alertas existentes por clave semántica tipo::ordenId
  const alertasPorClave = new Map<string, Alerta>()
  for (const a of alertasExistentes) {
    if (a.ordenId) {
      alertasPorClave.set(`${a.tipo}::${a.ordenId}`, a)
    }
  }

  const alertasACrear: Alerta[] = []
  const idsAEliminar: string[] = []

  const estadosTerminal = new Set(['listo', 'entregado'])
  const estadosActivos = new Set(['pendiente', 'en_produccion', 'con_riesgo'])

  // 3. Evaluar condiciones por orden
  for (const orden of ordenes) {

    // ── Alerta: entrega_proxima ──────────────────────────────
    if (config.alertaEntregaActiva !== false && estadosActivos.has(orden.estado)) {
      const diasRestantes = diasHastaFecha(orden.fechaEntrega)
      const diasAlerta = config.diasAlertaEntrega ?? 3
      const condicion = diasRestantes >= 0 && diasRestantes <= diasAlerta
      const clave = `entrega_proxima::${orden.id}`
      const existente = alertasPorClave.get(clave)

      if (condicion && !existente) {
        const prioridad = diasRestantes <= 1 ? 'alta' : diasRestantes <= 2 ? 'media' : 'baja'
        const cuandoVence =
          diasRestantes === 0 ? 'hoy' :
          diasRestantes === 1 ? 'mañana' :
          `en ${diasRestantes} días`
        alertasACrear.push({
          id: uuidv4(),
          tipo: 'entrega_proxima',
          prioridad,
          mensaje: `La orden ${orden.folio} vence ${cuandoVence} (${formatearFecha(orden.fechaEntrega)})`,
          ordenId: orden.id,
          folio: orden.folio,
          vista: false,
          fechaGeneracion: new Date().toISOString(),
          perfilId,
        })
      } else if (!condicion && existente) {
        idsAEliminar.push(existente.id)
      }
    }

    // ── Alerta: proyeccion_ajustada ──────────────────────────
    if (config.alertaProyeccionActiva !== false && estadosActivos.has(orden.estado)) {
      const molde = moldeMap.get(orden.moldeId)
      const material = materialMap.get(orden.materialId)
      const clave = `proyeccion_ajustada::${orden.id}`
      const existente = alertasPorClave.get(clave)

      if (molde && material) {
        const calcs = calcularDatosOrden(orden, molde, material)
        const condicion =
          calcs.proyeccionEstado === 'amarillo' || calcs.proyeccionEstado === 'rojo'

        if (condicion && !existente) {
          const prioridad = calcs.proyeccionEstado === 'rojo' ? 'alta' : 'media'
          const signo = calcs.margenDias >= 0 ? '+' : ''
          const descripcion =
            calcs.proyeccionEstado === 'rojo' ? 'en riesgo' : 'ajustada'
          alertasACrear.push({
            id: uuidv4(),
            tipo: 'proyeccion_ajustada',
            prioridad,
            mensaje: `La proyección de ${orden.folio} está ${descripcion} con ${signo}${calcs.margenDias} días de holgura`,
            ordenId: orden.id,
            folio: orden.folio,
            vista: false,
            fechaGeneracion: new Date().toISOString(),
            perfilId,
          })
        } else if (!condicion && existente) {
          idsAEliminar.push(existente.id)
        }
      }
    }

    // ── Alerta: inventario_bajo ──────────────────────────────
    if (
      config.alertaInventarioActiva !== false &&
      orden.tipoOrden === 'recurrente' &&
      orden.frecuencia &&
      estadosTerminal.has(orden.estado)
    ) {
      const frecDias = frecuenciaToDias(orden.frecuencia)
      const diasDesde = diasDesdeHoy(orden.fechaEntrega)
      const diasHastaSiguiente = frecDias - diasDesde
      const threshold = Math.max(3, Math.floor(frecDias * 0.2))
      const condicion = diasHastaSiguiente <= threshold

      const clave = `inventario_bajo::${orden.id}`
      const existente = alertasPorClave.get(clave)

      if (condicion && !existente) {
        const prioridad = diasHastaSiguiente <= 1 ? 'alta' : 'media'
        const diasRestantes = Math.max(0, diasHastaSiguiente)
        alertasACrear.push({
          id: uuidv4(),
          tipo: 'inventario_bajo',
          prioridad,
          mensaje: `La orden recurrente ${orden.folio} se repite en ${diasRestantes} día(s), verifica el inventario de material`,
          ordenId: orden.id,
          folio: orden.folio,
          materialId: orden.materialId,
          vista: false,
          fechaGeneracion: new Date().toISOString(),
          perfilId,
        })
      } else if (!condicion && existente) {
        idsAEliminar.push(existente.id)
      }
    }
  }

  // 4. Eliminar alertas huérfanas (cuya orden ya no existe)
  const ordenIdsActivos = new Set(ordenes.map(o => o.id))
  for (const alerta of alertasExistentes) {
    if (alerta.ordenId && !ordenIdsActivos.has(alerta.ordenId)) {
      if (!idsAEliminar.includes(alerta.id)) {
        idsAEliminar.push(alerta.id)
      }
    }
  }

  // 5. Aplicar cambios en transacción
  await db.transaction('rw', [db.alertas], async () => {
    if (idsAEliminar.length > 0) {
      await db.alertas.bulkDelete(idsAEliminar)
    }
    if (alertasACrear.length > 0) {
      await db.alertas.bulkAdd(alertasACrear)
    }
  })
}

// ----------------------------
// Hook reactivo
// ----------------------------

interface FiltroAlertas {
  tipo?: TipoAlerta
  soloNoLeidas?: boolean
}

export function useAlertas(
  perfilId: string | null,
  filtro?: FiltroAlertas
): Alerta[] {
  return useLiveQuery<Alerta[]>(
    async () => {
      if (!perfilId) return []
      let resultados = await db.alertas
        .where('perfilId')
        .equals(perfilId)
        .toArray()

      if (filtro?.tipo) {
        resultados = resultados.filter(a => a.tipo === filtro.tipo)
      }
      if (filtro?.soloNoLeidas) {
        resultados = resultados.filter(a => !a.vista)
      }

      // Ordenar por fechaGeneracion descendente (más recientes primero)
      return resultados.sort((a, b) =>
        b.fechaGeneracion.localeCompare(a.fechaGeneracion)
      )
    },
    [perfilId, filtro?.tipo, filtro?.soloNoLeidas]
  ) ?? []
}

// ----------------------------
// Mutaciones
// ----------------------------

export async function marcarVistaAlerta(id: string): Promise<void> {
  await db.alertas.update(id, { vista: true })
}

export async function marcarTodasVistas(perfilId: string): Promise<void> {
  await db.alertas
    .where('perfilId')
    .equals(perfilId)
    .modify({ vista: true })
}

export async function eliminarAlerta(id: string): Promise<void> {
  await db.alertas.delete(id)
}

export async function eliminarTodasAlertas(perfilId: string): Promise<void> {
  await db.alertas
    .where('perfilId')
    .equals(perfilId)
    .delete()
}
