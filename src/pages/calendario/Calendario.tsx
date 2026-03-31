// ============================================================
// PlastiFlow — Página: Calendario de Producción (Gantt)
// ============================================================

import { useState, useMemo, useRef, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'
import { useApp } from '../../context/AppContext'
import { db } from '../../db/database'
import { calcularDatosOrden } from '../../utils/calculos'
import { chipEstadoOrden, labelEstadoOrden, cls } from '../../utils/ui'
import type { OrdenProduccion, Maquina, RegistroDiario } from '../../types'

type Vista = 'diaria' | 'semanal'

const COL_W_DIA = 44    // px por día
const COL_W_SEM = 120   // px por semana
const ROW_H = 52        // px por fila de máquina
const HEADER_H = 48     // px cabecera de fechas
const COL_LABEL = 180   // px columna de etiqueta (máquina)

// Paleta de colores por proyección
function colorBloque(estado: string) {
  if (estado === 'verde')    return 'bg-emerald-500 border-emerald-700'
  if (estado === 'amarillo') return 'bg-amber-400 border-amber-600'
  return 'bg-red-500 border-red-700'
}

// Formatear fecha ISO a texto corto
function fmtDia(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}
function fmtSemana(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}`
}

// Agregar N días a una fecha ISO
function addDias(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

// Diferencia en días entre dos fechas ISO (b - a)
function diffDias(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime()
  const db = new Date(b + 'T00:00:00').getTime()
  return Math.round((db - da) / 86400000)
}

// Lunes de la semana de una fecha
function lunesDe(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function SinPerfilActivo() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="text-5xl mb-4">🏭</div>
      <p className="text-gray-500 dark:text-gray-400">No hay perfil activo.</p>
      <a href="/configuracion" className={`${cls.btnPrimary} mt-4 inline-flex`}>Ir a Configuración</a>
    </div>
  )
}

// ─── Modal de registro diario ───────────────────────────────
interface ModalRegistroProps {
  orden: OrdenProduccion
  onCerrar: () => void
  perfilId: string
}

function ModalRegistro({ orden, onCerrar, perfilId }: ModalRegistroProps) {
  const registros = useLiveQuery<RegistroDiario[]>(
    () => db.registrosDiarios.where('ordenId').equals(orden.id).toArray(),
    [orden.id]
  ) ?? []

  const molde = useLiveQuery(() => db.moldes.get(orden.moldeId), [orden.moldeId])
  const material = useLiveQuery(() => db.materiales.get(orden.materialId), [orden.materialId])
  const calculos = useMemo(() => {
    if (!molde || !material) return null
    return calcularDatosOrden(orden, molde, material)
  }, [orden, molde, material])

  // Construir lista de días de la orden
  const dias = useMemo(() => {
    const result: string[] = []
    let cur = orden.fechaInicio
    const fin = calculos?.fechaEstimadaFin ?? orden.fechaEntrega
    while (cur <= fin) {
      result.push(cur)
      cur = addDias(cur, 1)
    }
    return result.slice(0, 60) // máx 60 días
  }, [orden.fechaInicio, calculos])

  const regMap = useMemo(() =>
    Object.fromEntries(registros.map(r => [r.fecha, r])),
    [registros]
  )

  // Piezas programadas por día (distribuidas uniformemente)
  const piezasPorDia = useMemo(() => {
    if (!dias.length) return 0
    return Math.ceil(orden.cantidadRequerida / dias.length)
  }, [orden.cantidadRequerida, dias.length])

  const handleProducidoChange = async (fecha: string, valor: string) => {
    const producido = parseInt(valor) || 0
    const existente = regMap[fecha]
    if (existente) {
      await db.registrosDiarios.update(existente.id, { producido })
    } else {
      await db.registrosDiarios.add({
        id: uuidv4(),
        ordenId: orden.id,
        fecha,
        programado: piezasPorDia,
        producido,
        perfilId,
      })
    }
  }

  const totalProgramado = dias.length * piezasPorDia
  const totalProducido = registros.reduce((s, r) => s + r.producido, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`${cls.card} w-full max-w-2xl max-h-[80vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{orden.folio} — {orden.producto}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{orden.fechaInicio} → {orden.fechaEntrega}</p>
          </div>
          <button onClick={onCerrar} className={cls.btnGhost}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Resumen */}
        <div className="flex gap-4 px-5 py-3 bg-gray-50 dark:bg-gray-800/50 shrink-0 text-xs">
          <div><span className="text-gray-400">Requerido</span><p className="font-semibold text-gray-900 dark:text-white">{orden.cantidadRequerida.toLocaleString('es-MX')} pzs</p></div>
          <div><span className="text-gray-400">Programado</span><p className="font-semibold text-blue-600 dark:text-blue-400">{totalProgramado.toLocaleString('es-MX')} pzs</p></div>
          <div><span className="text-gray-400">Producido</span><p className="font-semibold text-emerald-600 dark:text-emerald-400">{totalProducido.toLocaleString('es-MX')} pzs</p></div>
          <div><span className="text-gray-400">Diferencia</span><p className={`font-semibold ${totalProducido - totalProgramado >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{(totalProducido - totalProgramado).toLocaleString('es-MX')} pzs</p></div>
        </div>

        {/* Tabla de días */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white dark:bg-gray-900">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Fecha</th>
                <th className="text-right px-4 py-2 text-gray-500 font-medium">Programado</th>
                <th className="text-right px-4 py-2 text-gray-500 font-medium">Producido</th>
                <th className="text-right px-4 py-2 text-gray-500 font-medium">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {dias.map(fecha => {
                const reg = regMap[fecha]
                const prod = reg?.producido ?? 0
                const diff = prod - piezasPorDia
                return (
                  <tr key={fecha} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-1.5 text-gray-700 dark:text-gray-300">{fmtDia(fecha)}</td>
                    <td className="px-4 py-1.5 text-right text-gray-500">{piezasPorDia.toLocaleString('es-MX')}</td>
                    <td className="px-4 py-1.5 text-right">
                      <input
                        type="number"
                        min="0"
                        defaultValue={prod || ''}
                        placeholder="0"
                        className="w-20 text-right px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs"
                        onBlur={e => handleProducidoChange(fecha, e.target.value)}
                      />
                    </td>
                    <td className={`px-4 py-1.5 text-right font-medium ${diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {prod > 0 ? (diff >= 0 ? '+' : '') + diff.toLocaleString('es-MX') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────
export default function Calendario() {
  const { perfilActivoId } = useApp()
  const [vista, setVista] = useState<Vista>('diaria')
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenProduccion | null>(null)

  // Datos reactivos
  const maquinas = useLiveQuery<Maquina[]>(
    () => perfilActivoId ? db.maquinas.where('perfilId').equals(perfilActivoId).toArray() : [],
    [perfilActivoId]
  ) ?? []

  const ordenes = useLiveQuery<OrdenProduccion[]>(
    () => perfilActivoId ? db.ordenes.where('perfilId').equals(perfilActivoId).toArray() : [],
    [perfilActivoId]
  ) ?? []

  const moldes = useLiveQuery(
    () => perfilActivoId ? db.moldes.where('perfilId').equals(perfilActivoId).toArray() : [],
    [perfilActivoId]
  ) ?? []

  const materiales = useLiveQuery(
    () => perfilActivoId ? db.materiales.where('perfilId').equals(perfilActivoId).toArray() : [],
    [perfilActivoId]
  ) ?? []

  const moldeMap = useMemo(() => Object.fromEntries(moldes.map(m => [m.id, m])), [moldes])
  const matMap = useMemo(() => Object.fromEntries(materiales.map(m => [m.id, m])), [materiales])

  // ── Ventana de tiempo ──
  const hoy = useMemo(() => new Date().toISOString().split('T')[0], [])
  const ventanaInicio = useMemo(() =>
    vista === 'diaria' ? addDias(hoy, -7) : lunesDe(addDias(hoy, -14)),
    [hoy, vista]
  )
  const ventanaFin = useMemo(() =>
    vista === 'diaria' ? addDias(hoy, 60) : addDias(lunesDe(addDias(hoy, 84)), 6),
    [hoy, vista]
  )

  // ── Columnas ──
  const columnas = useMemo(() => {
    const cols: string[] = []
    if (vista === 'diaria') {
      let cur = ventanaInicio
      while (cur <= ventanaFin) {
        cols.push(cur)
        cur = addDias(cur, 1)
      }
    } else {
      let cur = lunesDe(ventanaInicio)
      while (cur <= ventanaFin) {
        cols.push(cur)
        cur = addDias(cur, 7)
      }
    }
    return cols
  }, [vista, ventanaInicio, ventanaFin])

  const colW = vista === 'diaria' ? COL_W_DIA : COL_W_SEM

  // ── Cálculos de órdenes para posicionamiento ──
  const ordenesConCalc = useMemo(() => {
    return ordenes
      .filter(o => o.estado !== 'entregado')
      .map(o => {
        const molde = moldeMap[o.moldeId]
        const mat = matMap[o.materialId]
        const calc = molde && mat ? calcularDatosOrden(o, molde, mat) : null
        const fechaFin = calc?.fechaEstimadaFin ?? o.fechaEntrega
        const proyeccion = calc?.proyeccionEstado ?? 'amarillo'
        return { orden: o, fechaFin, proyeccion }
      })
  }, [ordenes, moldeMap, matMap])

  // ── Filas: máquinas + fila "Sin máquina" ──
  const filas = useMemo(() => {
    const rows: { id: string; nombre: string }[] = maquinas.map(m => ({ id: m.id, nombre: m.nombre }))
    const haySinMaquina = ordenesConCalc.some(o => !o.orden.maquinaId)
    if (haySinMaquina) rows.push({ id: '', nombre: 'Sin máquina' })
    return rows
  }, [maquinas, ordenesConCalc])

  // ── Drag & Drop ──
  const dragOrdenId = useRef<string | null>(null)
  const dragStartCol = useRef<number>(0)

  const handleDragStart = useCallback((e: React.DragEvent, ordenId: string, inicioIso: string) => {
    dragOrdenId.current = ordenId
    const colIdx = vista === 'diaria'
      ? diffDias(ventanaInicio, inicioIso)
      : Math.floor(diffDias(ventanaInicio, lunesDe(inicioIso)) / 7)
    dragStartCol.current = colIdx
    e.dataTransfer.effectAllowed = 'move'
    // Guardar la posición X dentro del bloque para calcular offset
    e.dataTransfer.setData('text/plain', String(colIdx))
  }, [vista, ventanaInicio])

  const handleDrop = useCallback(async (e: React.DragEvent, colIdx: number) => {
    e.preventDefault()
    const id = dragOrdenId.current
    if (!id) return
    const orden = ordenes.find(o => o.id === id)
    if (!orden) return

    const deltaCol = colIdx - dragStartCol.current
    if (deltaCol === 0) return

    const deltaDias = vista === 'diaria' ? deltaCol : deltaCol * 7
    const duracion = diffDias(orden.fechaInicio, orden.fechaEntrega)
    const nuevaInicio = addDias(orden.fechaInicio, deltaDias)
    const nuevaFin = addDias(nuevaInicio, duracion)

    await db.ordenes.update(id, {
      fechaInicio: nuevaInicio,
      fechaEntrega: nuevaFin,
      fechaModificacion: hoy,
    })
    dragOrdenId.current = null
  }, [ordenes, vista, hoy])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  if (!perfilActivoId) return <SinPerfilActivo />

  const totalW = COL_LABEL + columnas.length * colW

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      {/* Cabecera */}
      <div className="flex items-center justify-between shrink-0">
        <h1 className={cls.pageTitle}>Calendario de Producción</h1>
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => setVista('diaria')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              vista === 'diaria'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            Diaria
          </button>
          <button
            onClick={() => setVista('semanal')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              vista === 'semanal'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            Semanal
          </button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 shrink-0">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" />A tiempo</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400 inline-block" />Con riesgo</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 inline-block" />Retrasado</span>
        <span className="ml-4 text-gray-400">Arrastra los bloques para reprogramar · Clic para ver registro diario</span>
      </div>

      {/* Gantt */}
      <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-xl">
        <div style={{ width: totalW, minWidth: '100%' }}>

          {/* Cabecera de fechas */}
          <div
            className="flex sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
            style={{ height: HEADER_H }}
          >
            {/* Etiqueta vacía alineada con la columna de máquinas */}
            <div
              className="shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              style={{ width: COL_LABEL }}
            />
            {columnas.map(col => {
              const esHoy = vista === 'diaria' ? col === hoy : col <= hoy && addDias(col, 6) >= hoy
              return (
                <div
                  key={col}
                  style={{ width: colW, minWidth: colW }}
                  className={`shrink-0 flex items-center justify-center border-r border-gray-100 dark:border-gray-800 text-xs font-medium
                    ${esHoy ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}
                  `}
                >
                  {vista === 'diaria' ? fmtDia(col) : fmtSemana(col)}
                </div>
              )
            })}
          </div>

          {/* Filas de máquinas */}
          {filas.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400 dark:text-gray-500">
              No hay máquinas ni órdenes activas. Crea máquinas y órdenes para ver el calendario.
            </div>
          ) : (
            filas.map((fila, filaIdx) => {
              const ordensDeFila = ordenesConCalc.filter(o =>
                (fila.id === '' ? !o.orden.maquinaId : o.orden.maquinaId === fila.id) &&
                o.orden.fechaInicio <= ventanaFin && o.fechaFin >= ventanaInicio
              )
              const esUltima = filaIdx === filas.length - 1

              return (
                <div
                  key={fila.id || '__sin__'}
                  className="flex relative"
                  style={{ height: ROW_H }}
                >
                  {/* Etiqueta de máquina */}
                  <div
                    className="shrink-0 flex items-center px-3 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 sticky left-0 z-10"
                    style={{ width: COL_LABEL }}
                  >
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{fila.nombre}</span>
                  </div>

                  {/* Celdas de tiempo (drop targets) */}
                  <div className="relative flex-1 flex" style={{ borderBottom: esUltima ? 'none' : undefined }}>
                    {columnas.map((col, colIdx) => {
                      const esHoy = vista === 'diaria' ? col === hoy : col <= hoy && addDias(col, 6) >= hoy
                      return (
                        <div
                          key={col}
                          style={{ width: colW, minWidth: colW }}
                          className={`shrink-0 h-full border-r border-gray-100 dark:border-gray-800 ${!esUltima ? 'border-b' : ''} border-gray-100 dark:border-gray-800
                            ${esHoy ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}
                          `}
                          onDragOver={handleDragOver}
                          onDrop={e => handleDrop(e, colIdx)}
                        />
                      )
                    })}

                    {/* Bloques de órdenes */}
                    {ordensDeFila.map(({ orden, fechaFin, proyeccion }) => {
                      const inicioEfectivo = orden.fechaInicio < ventanaInicio ? ventanaInicio : orden.fechaInicio
                      const finEfectivo = fechaFin > ventanaFin ? ventanaFin : fechaFin

                      let colStart: number
                      let colSpan: number

                      if (vista === 'diaria') {
                        colStart = diffDias(ventanaInicio, inicioEfectivo)
                        colSpan = diffDias(inicioEfectivo, finEfectivo) + 1
                      } else {
                        colStart = Math.floor(diffDias(ventanaInicio, lunesDe(inicioEfectivo)) / 7)
                        colSpan = Math.ceil(diffDias(lunesDe(inicioEfectivo), finEfectivo) / 7) + 1
                      }

                      if (colSpan < 1) colSpan = 1

                      return (
                        <div
                          key={orden.id}
                          draggable
                          onDragStart={e => handleDragStart(e, orden.id, orden.fechaInicio)}
                          onClick={() => setOrdenSeleccionada(orden)}
                          title={`${orden.folio} — ${orden.producto}`}
                          className={`absolute top-1.5 bottom-1.5 rounded border cursor-grab active:cursor-grabbing select-none flex items-center px-2 overflow-hidden z-10 hover:brightness-110 transition-all ${colorBloque(proyeccion)}`}
                          style={{
                            left: colStart * colW + 2,
                            width: Math.max(colSpan * colW - 4, 20),
                          }}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="text-white text-[10px] font-bold truncate leading-tight">{orden.folio}</span>
                            {colSpan * colW > 80 && (
                              <span className="text-white/80 text-[9px] truncate leading-tight">{orden.producto}</span>
                            )}
                          </div>
                          <span className={`ml-auto shrink-0 text-[9px] px-1 py-0.5 rounded font-medium bg-white/20 text-white`}>
                            {labelEstadoOrden(orden.estado)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Modal registro diario */}
      {ordenSeleccionada && (
        <ModalRegistro
          orden={ordenSeleccionada}
          onCerrar={() => setOrdenSeleccionada(null)}
          perfilId={perfilActivoId}
        />
      )}
    </div>
  )
}
