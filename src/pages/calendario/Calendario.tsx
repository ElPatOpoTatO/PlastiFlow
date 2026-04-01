// ============================================================
// PlastiFlow — Página: Calendario de Producción (Gantt)
// ============================================================

import { useState, useMemo, useRef, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'
import { useApp } from '../../context/AppContext'
import { db } from '../../db/database'
import { calcularDatosOrden } from '../../utils/calculos'
import { cls } from '../../utils/ui'
import type { OrdenProduccion, Maquina, RegistroDiario } from '../../types'

type Vista = 'diaria' | 'semanal' | 'mensual'

const COL_W_DIA = 44    // px por día
const COL_W_SEM = 120   // px por semana
const COL_W_MES = 100   // px por mes
const ROW_H     = 52    // px por fila de máquina
const HEADER_H  = 48    // px cabecera de fechas
const COL_LABEL = 180   // px columna etiqueta

// ── Color del punto indicador de estado ─────────────────────
function dotColor(estado: string, proyeccion: string): string {
  if (estado === 'en_produccion') return '#3b82f6'          // azul
  if (estado === 'listo' || estado === 'entregado') return '#22c55e' // verde
  if (estado === 'con_riesgo') return '#ef4444'             // rojo
  // pendiente → usar proyección
  if (proyeccion === 'verde')    return '#22c55e'
  if (proyeccion === 'amarillo') return '#eab308'
  return '#ef4444'
}

// ── Helpers de fecha ─────────────────────────────────────────
function fmtDia(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}
function fmtSemana(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}
function fmtMes(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })
}

function addDias(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function diffDias(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime()
  const db_ = new Date(b + 'T00:00:00').getTime()
  return Math.round((db_ - da) / 86400000)
}

function lunesDe(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function primerDiaMes(iso: string): string {
  return iso.slice(0, 7) + '-01'
}

function siguienteMes(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  d.setMonth(d.getMonth() + 1)
  d.setDate(1)
  return d.toISOString().split('T')[0]
}

// ── Sin perfil ───────────────────────────────────────────────
function SinPerfilActivo() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="text-5xl mb-4">🏭</div>
      <p className="text-gray-500 dark:text-gray-400">No hay perfil activo.</p>
      <a href="/configuracion" className={`${cls.btnPrimary} mt-4 inline-flex`}>Ir a Configuración</a>
    </div>
  )
}

// ─── Modal de registro diario ────────────────────────────────
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

  const molde    = useLiveQuery(() => db.moldes.get(orden.moldeId),     [orden.moldeId])
  const material = useLiveQuery(() => db.materiales.get(orden.materialId), [orden.materialId])
  const maquina  = useLiveQuery(
    () => orden.maquinaId ? db.maquinas.get(orden.maquinaId) : undefined,
    [orden.maquinaId]
  )
  const calculos = useMemo(() => {
    if (!molde || !material) return null
    return calcularDatosOrden(orden, molde, material, maquina)
  }, [orden, molde, material, maquina])

  const dias = useMemo(() => {
    const result: string[] = []
    let cur = orden.fechaInicio
    const fin = calculos?.fechaEstimadaFin ?? orden.fechaEntrega
    while (cur <= fin) {
      result.push(cur)
      cur = addDias(cur, 1)
    }
    return result.slice(0, 60)
  }, [orden.fechaInicio, calculos])

  const regMap = useMemo(() =>
    Object.fromEntries(registros.map(r => [r.fecha, r])),
    [registros]
  )

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
        id: uuidv4(), ordenId: orden.id, fecha,
        programado: piezasPorDia, producido, perfilId,
      })
    }
  }

  const totalProgramado = dias.length * piezasPorDia
  const totalProducido  = registros.reduce((s, r) => s + r.producido, 0)

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
        {/* Tabla */}
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
                const reg  = regMap[fecha]
                const prod = reg?.producido ?? 0
                const diff = prod - piezasPorDia
                return (
                  <tr key={fecha} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-1.5 text-gray-700 dark:text-gray-300">{fmtDia(fecha)}</td>
                    <td className="px-4 py-1.5 text-right text-gray-500">{piezasPorDia.toLocaleString('es-MX')}</td>
                    <td className="px-4 py-1.5 text-right">
                      <input
                        type="number" min="0"
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

// ─── Componente principal ─────────────────────────────────────
export default function Calendario() {
  const { perfilActivoId } = useApp()
  const [vista, setVista] = useState<Vista>('diaria')
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenProduccion | null>(null)

  // ── Datos reactivos ──
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

  const moldeMap = useMemo(() => Object.fromEntries(moldes.map(m   => [m.id, m])), [moldes])
  const matMap   = useMemo(() => Object.fromEntries(materiales.map(m => [m.id, m])), [materiales])
  const maqMap   = useMemo(() => Object.fromEntries(maquinas.map(m  => [m.id, m])), [maquinas])

  // ── Fecha de hoy ──
  const hoy = useMemo(() => new Date().toISOString().split('T')[0], [])

  // ── Ventana de tiempo ──
  const ventanaInicio = useMemo(() => {
    if (vista === 'diaria')  return addDias(hoy, -7)
    if (vista === 'semanal') return lunesDe(addDias(hoy, -14))
    // mensual: 3 meses atrás, primer día del mes
    const d = new Date(hoy + 'T00:00:00')
    d.setMonth(d.getMonth() - 3, 1)
    return d.toISOString().split('T')[0]
  }, [hoy, vista])

  const ventanaFin = useMemo(() => {
    if (vista === 'diaria')  return addDias(hoy, 60)
    if (vista === 'semanal') return addDias(lunesDe(addDias(hoy, 84)), 6)
    // mensual: 9 meses adelante, último día del mes
    const d = new Date(hoy + 'T00:00:00')
    d.setMonth(d.getMonth() + 10, 0)
    return d.toISOString().split('T')[0]
  }, [hoy, vista])

  // ── Columnas ──
  const columnas = useMemo(() => {
    const cols: string[] = []
    if (vista === 'diaria') {
      let cur = ventanaInicio
      while (cur <= ventanaFin) { cols.push(cur); cur = addDias(cur, 1) }
    } else if (vista === 'semanal') {
      let cur = lunesDe(ventanaInicio)
      while (cur <= ventanaFin) { cols.push(cur); cur = addDias(cur, 7) }
    } else {
      let cur = primerDiaMes(ventanaInicio)
      while (cur <= ventanaFin) { cols.push(cur); cur = siguienteMes(cur) }
    }
    return cols
  }, [vista, ventanaInicio, ventanaFin])

  const colW = vista === 'diaria' ? COL_W_DIA : vista === 'semanal' ? COL_W_SEM : COL_W_MES

  // ── Conversión fecha ↔ píxeles (posicionamiento exacto) ──
  const dateToPixel = useCallback((iso: string): number => {
    if (vista !== 'mensual') {
      const ppd = vista === 'diaria' ? COL_W_DIA : COL_W_SEM / 7
      return diffDias(ventanaInicio, iso) * ppd
    }
    // Mensual: interpolar dentro del mes para alineación exacta
    for (let i = 0; i < columnas.length; i++) {
      const ms = columnas[i]
      const me = i + 1 < columnas.length ? columnas[i + 1] : addDias(ventanaFin, 1)
      if (iso >= ms && iso < me) {
        const dim = diffDias(ms, me)
        return i * COL_W_MES + (diffDias(ms, iso) / dim) * COL_W_MES
      }
    }
    return columnas.length * COL_W_MES
  }, [vista, ventanaInicio, ventanaFin, columnas])

  const pixelToDate = useCallback((px: number): string => {
    if (vista !== 'mensual') {
      const ppd = vista === 'diaria' ? COL_W_DIA : COL_W_SEM / 7
      return addDias(ventanaInicio, Math.round(px / ppd))
    }
    const colIdx = Math.min(Math.max(Math.floor(px / COL_W_MES), 0), columnas.length - 1)
    const colFrac = Math.max(0, px - colIdx * COL_W_MES) / COL_W_MES
    const ms  = columnas[colIdx]
    const me  = colIdx + 1 < columnas.length ? columnas[colIdx + 1] : addDias(ventanaFin, 1)
    const dim = diffDias(ms, me)
    return addDias(ms, Math.round(colFrac * dim))
  }, [vista, ventanaInicio, ventanaFin, columnas])

  // ── Cálculos de órdenes para posicionamiento ──
  const ordenesConCalc = useMemo(() => {
    return ordenes
      .filter(o => o.estado !== 'entregado')
      .map(o => {
        const molde = moldeMap[o.moldeId]
        const mat   = matMap[o.materialId]
        const calc  = molde && mat ? calcularDatosOrden(o, molde, mat, maqMap[o.maquinaId]) : null
        // El bloque cubre hasta la fecha de entrega (mínimo) o la fecha estimada si es mayor
        const fechaFinCalc = calc?.fechaEstimadaFin ?? o.fechaEntrega
        const fechaFin     = fechaFinCalc > o.fechaEntrega ? fechaFinCalc : o.fechaEntrega
        const proyeccion   = calc?.proyeccionEstado ?? 'amarillo'
        return { orden: o, fechaFin, proyeccion }
      })
  }, [ordenes, moldeMap, matMap, maqMap])

  // ── Filas: máquinas + "Sin máquina" si aplica ──
  const filas = useMemo(() => {
    const rows: { id: string; nombre: string }[] = maquinas.map(m => ({ id: m.id, nombre: m.nombre }))
    const haySinMaquina = ordenesConCalc.some(o => !o.orden.maquinaId)
    if (haySinMaquina) rows.push({ id: '', nombre: 'Sin máquina' })
    return rows
  }, [maquinas, ordenesConCalc])

  // ── Drag & Drop ──
  const dragOrdenId  = useRef<string | null>(null)
  const dragOffsetX  = useRef<number>(0)
  const ganttRef     = useRef<HTMLDivElement>(null)

  const handleDragStart = useCallback((e: React.DragEvent, ordenId: string) => {
    dragOrdenId.current = ordenId
    const blockRect = (e.target as HTMLElement).closest('[draggable]')?.getBoundingClientRect()
    dragOffsetX.current = blockRect ? e.clientX - blockRect.left : 0
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', ordenId)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    const id = dragOrdenId.current
    if (!id) return
    const orden = ordenes.find(o => o.id === id)
    if (!orden || !ganttRef.current) return

    const ganttRect  = ganttRef.current.getBoundingClientRect()
    const scrollLeft = ganttRef.current.scrollLeft
    const scrollTop  = ganttRef.current.scrollTop

    // Nueva fecha de inicio desde posición X
    const xInGantt   = e.clientX - ganttRect.left + scrollLeft - COL_LABEL - dragOffsetX.current
    const nuevaInicio = pixelToDate(xInGantt)
    const duracion    = diffDias(orden.fechaInicio, orden.fechaEntrega)
    const nuevaFin    = addDias(nuevaInicio, duracion)

    // Máquina destino desde posición Y (mover entre máquinas)
    const yInContent  = e.clientY - ganttRect.top + scrollTop - HEADER_H
    const rowIdx      = Math.max(0, Math.min(filas.length - 1, Math.floor(yInContent / ROW_H)))
    const targetMaqId = filas[rowIdx]?.id ?? ''

    const dateChanged    = nuevaInicio !== orden.fechaInicio
    const machineChanged = targetMaqId !== (orden.maquinaId || '')

    if (!dateChanged && !machineChanged) {
      dragOrdenId.current = null
      return
    }

    const updates: Record<string, unknown> = { fechaModificacion: hoy }
    if (dateChanged)    { updates.fechaInicio = nuevaInicio; updates.fechaEntrega = nuevaFin }
    if (machineChanged) { updates.maquinaId = targetMaqId }

    await db.ordenes.update(id, updates)
    dragOrdenId.current = null
  }, [ordenes, pixelToDate, hoy, filas])

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
          {(['diaria', 'semanal', 'mensual'] as Vista[]).map(v => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                vista === v
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              {v === 'diaria' ? 'Diaria' : v === 'semanal' ? 'Semanal' : 'Mensual'}
            </button>
          ))}
        </div>
      </div>

      {/* Leyenda de puntos de estado */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 shrink-0 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />En proceso
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Completado / A tiempo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />Con riesgo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Retrasado
        </span>
        <span className="ml-2 text-gray-400 hidden sm:inline">
          Arrastra para reprogramar y mover entre máquinas · Clic para ver registro diario
        </span>
      </div>

      {/* Gantt */}
      <div
        ref={ganttRef}
        className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-xl"
      >
        <div style={{ width: totalW, minWidth: '100%' }}>

          {/* Cabecera de fechas */}
          <div
            className="flex sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
            style={{ height: HEADER_H }}
          >
            <div
              className="shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              style={{ width: COL_LABEL }}
            />
            {columnas.map((col, idx) => {
              const esHoy =
                vista === 'diaria'
                  ? col === hoy
                  : vista === 'semanal'
                  ? col <= hoy && addDias(col, 6) >= hoy
                  : col <= hoy && (idx + 1 < columnas.length ? columnas[idx + 1] : addDias(ventanaFin, 1)) > hoy
              return (
                <div
                  key={col}
                  style={{ width: colW, minWidth: colW }}
                  className={`shrink-0 flex items-center justify-center border-r border-gray-100 dark:border-gray-800 text-xs font-medium
                    ${esHoy ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}
                  `}
                >
                  {vista === 'diaria' ? fmtDia(col) : vista === 'semanal' ? fmtSemana(col) : fmtMes(col)}
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
                  <div className="relative flex-1 flex">
                    {columnas.map((col, colIdx) => {
                      const esHoy =
                        vista === 'diaria'
                          ? col === hoy
                          : vista === 'semanal'
                          ? col <= hoy && addDias(col, 6) >= hoy
                          : col <= hoy && (colIdx + 1 < columnas.length ? columnas[colIdx + 1] : addDias(ventanaFin, 1)) > hoy
                      return (
                        <div
                          key={col}
                          style={{ width: colW, minWidth: colW }}
                          className={`shrink-0 h-full border-r border-gray-100 dark:border-gray-800 ${!esUltima ? 'border-b' : ''} border-gray-100 dark:border-gray-800
                            ${esHoy ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}
                          `}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                        />
                      )
                    })}

                    {/* Bloques de órdenes — cubren todo el espacio de inicio a fin */}
                    {ordensDeFila.map(({ orden, fechaFin, proyeccion }) => {
                      const inicioEfectivo = orden.fechaInicio < ventanaInicio ? ventanaInicio : orden.fechaInicio
                      const finEfectivo    = fechaFin > ventanaFin ? ventanaFin : fechaFin
                      const blockLeft  = dateToPixel(inicioEfectivo)
                      const blockRight = dateToPixel(addDias(finEfectivo, 1))
                      const blockWidth = Math.max(blockRight - blockLeft, 20)
                      const bgColor    = orden.color || 'hsl(202, 77%, 61%)'

                      return (
                        <div
                          key={orden.id}
                          draggable
                          onDragStart={e => handleDragStart(e, orden.id)}
                          onClick={() => setOrdenSeleccionada(orden)}
                          title={`${orden.folio} — ${orden.producto}`}
                          className="absolute inset-y-0 cursor-grab active:cursor-grabbing select-none flex items-center px-2 overflow-hidden z-10 hover:brightness-110 transition-all"
                          style={{
                            left: blockLeft,
                            width: blockWidth,
                            backgroundColor: bgColor,
                          }}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="text-white text-[10px] font-bold truncate leading-tight drop-shadow-sm">
                              {orden.folio}
                            </span>
                            {blockWidth > 80 && (
                              <span className="text-white/80 text-[9px] truncate leading-tight">
                                {orden.producto}
                              </span>
                            )}
                          </div>
                          {/* Punto indicador de estado en esquina superior derecha */}
                          <span
                            className="absolute top-1 right-1 w-3 h-3 rounded-full border-2 border-white/60 shadow-sm shrink-0"
                            style={{ backgroundColor: dotColor(orden.estado, proyeccion) }}
                          />
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

      {/* Modal de registro diario */}
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
