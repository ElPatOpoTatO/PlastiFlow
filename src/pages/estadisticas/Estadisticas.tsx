// ============================================================
// PlastiFlow — Estadísticas (Fase 7)
// ============================================================

import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, Cell,
} from 'recharts'
import { useApp } from '../../context/AppContext'
import { db } from '../../db/database'
import { calcularDatosOrden, formatearFecha, formatearNumero } from '../../utils/calculos'
import { cls } from '../../utils/ui'
import SinPerfilActivo from '../../components/ui/SinPerfilActivo'
import EmptyState from '../../components/ui/EmptyState'
import type { OrdenProduccion, Maquina, Molde, Material } from '../../types'

// ─────────────────────────────────────────────
// Tipos y helpers de fecha
// ─────────────────────────────────────────────

type TabReporte = 'maquinas' | 'productos' | 'materiales' | 'gantt'
type PeriodoPreset = '7d' | '30d' | '90d' | 'anio' | 'custom'

function isoHoy(): string {
  return new Date().toISOString().split('T')[0]
}

function isoHace(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() - dias)
  return d.toISOString().split('T')[0]
}

function isoInicioAnio(): string {
  return `${new Date().getFullYear()}-01-01`
}

function mesLabel(isoMes: string): string {
  const [year, month] = isoMes.split('-')
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${meses[parseInt(month) - 1]} ${year}`
}

const PERIODOS: { valor: PeriodoPreset; label: string }[] = [
  { valor: '7d',    label: 'Últimos 7 días' },
  { valor: '30d',   label: 'Último mes' },
  { valor: '90d',   label: 'Último trimestre' },
  { valor: 'anio',  label: 'Año actual' },
  { valor: 'custom',label: 'Personalizado' },
]

const TABS: { valor: TabReporte; label: string; icono: string }[] = [
  { valor: 'maquinas',   label: 'Por Máquina',  icono: '⚙️' },
  { valor: 'productos',  label: 'Por Producto',  icono: '📦' },
  { valor: 'materiales', label: 'Consumo Mat.',  icono: '🧪' },
  { valor: 'gantt',      label: 'Carga de Trabajo', icono: '📅' },
]

// ─────────────────────────────────────────────
// Tooltip personalizado para el Gantt
// ─────────────────────────────────────────────

interface GanttTooltipProps {
  active?: boolean
  payload?: Array<{ payload: GanttItem }>
}

interface GanttItem {
  folio: string
  producto: string
  fechaInicio: string
  fechaFin: string
  margenDias: number
  proyeccion: string
  duracion: number
  offset: number
}

function GanttTooltip({ active, payload }: GanttTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-xs shadow-lg">
      <p className="font-bold text-gray-900 dark:text-white mb-1">{d.folio} — {d.producto}</p>
      <p className="text-gray-500 dark:text-gray-400">Inicio: {formatearFecha(d.fechaInicio)}</p>
      <p className="text-gray-500 dark:text-gray-400">Fin est.: {formatearFecha(d.fechaFin)}</p>
      <p className={`font-semibold mt-1 ${d.proyeccion === 'verde' ? 'text-green-600' : d.proyeccion === 'amarillo' ? 'text-yellow-600' : 'text-red-600'}`}>
        Holgura: {d.margenDias > 0 ? '+' : ''}{d.margenDias} días
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export default function Estadisticas() {
  const { perfilActivoId } = useApp()

  const [tabActiva, setTabActiva] = useState<TabReporte>('maquinas')
  const [periodoPreset, setPeriodoPreset] = useState<PeriodoPreset>('30d')
  const [fechaDesde, setFechaDesde] = useState(isoHace(30))
  const [fechaHasta, setFechaHasta] = useState(isoHoy)

  if (!perfilActivoId) return <SinPerfilActivo />

  // ── Datos reactivos ────────────────────────
  const ordenes    = useLiveQuery<OrdenProduccion[]>(() => db.ordenes.where('perfilId').equals(perfilActivoId).toArray(), [perfilActivoId]) ?? []
  const maquinas   = useLiveQuery<Maquina[]>(() => db.maquinas.where('perfilId').equals(perfilActivoId).toArray(), [perfilActivoId]) ?? []
  const moldes     = useLiveQuery<Molde[]>(() => db.moldes.where('perfilId').equals(perfilActivoId).toArray(), [perfilActivoId]) ?? []
  const materiales = useLiveQuery<Material[]>(() => db.materiales.where('perfilId').equals(perfilActivoId).toArray(), [perfilActivoId]) ?? []

  // Lookup maps
  const maquinaMap = useMemo(() => Object.fromEntries(maquinas.map(m => [m.id, m])), [maquinas])
  const moldeMap   = useMemo(() => Object.fromEntries(moldes.map(m => [m.id, m])), [moldes])
  const materialMap = useMemo(() => Object.fromEntries(materiales.map(m => [m.id, m])), [materiales])

  // Órdenes en rango (por fechaEntrega)
  const ordenesEnRango = useMemo(() =>
    ordenes.filter(o => o.fechaEntrega >= fechaDesde && o.fechaEntrega <= fechaHasta)
  , [ordenes, fechaDesde, fechaHasta])

  // ── Cambio de periodo ──────────────────────
  const handlePeriodo = (preset: PeriodoPreset) => {
    setPeriodoPreset(preset)
    if (preset === '7d')    { setFechaDesde(isoHace(7));   setFechaHasta(isoHoy()) }
    if (preset === '30d')   { setFechaDesde(isoHace(30));  setFechaHasta(isoHoy()) }
    if (preset === '90d')   { setFechaDesde(isoHace(90));  setFechaHasta(isoHoy()) }
    if (preset === 'anio')  { setFechaDesde(isoInicioAnio()); setFechaHasta(isoHoy()) }
  }

  // ── Reporte 1: Por Máquina ─────────────────
  const dataMaquinas = useMemo(() => {
    const entregadas = ordenesEnRango.filter(o => o.estado === 'entregado')
    const agrupado: Record<string, { piezas: number; ordenes: number }> = {}
    for (const o of entregadas) {
      const maq = maquinaMap[o.maquinaId]
      const key = maq ? maq.nombre : 'Sin máquina'
      if (!agrupado[key]) agrupado[key] = { piezas: 0, ordenes: 0 }
      agrupado[key].piezas += o.cantidadRequerida
      agrupado[key].ordenes += 1
    }
    return Object.entries(agrupado)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.piezas - a.piezas)
  }, [ordenesEnRango, maquinaMap])

  // ── Reporte 2: Por Producto ────────────────
  const dataProductos = useMemo(() => {
    const entregadas = ordenesEnRango.filter(o => o.estado === 'entregado')
    const agrupado: Record<string, { piezas: number; molde: string }> = {}
    for (const o of entregadas) {
      const key = o.producto
      const moldeName = moldeMap[o.moldeId]?.nombre ?? '—'
      if (!agrupado[key]) agrupado[key] = { piezas: 0, molde: moldeName }
      agrupado[key].piezas += o.cantidadRequerida
    }
    return Object.entries(agrupado)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.piezas - a.piezas)
      .slice(0, 10)
  }, [ordenesEnRango, moldeMap])

  // ── Reporte 3: Consumo de Material ────────
  const dataMateriales = useMemo(() => {
    const entregadas = ordenesEnRango.filter(o => o.estado === 'entregado')
    const porMes: Record<string, { materialNeto: number; merma: number }> = {}
    for (const o of entregadas) {
      const molde = moldeMap[o.moldeId]
      const material = materialMap[o.materialId]
      if (!molde || !material) continue
      const calc = calcularDatosOrden(o, molde, material, maquinaMap[o.maquinaId])
      const mes = o.fechaEntrega.slice(0, 7) // YYYY-MM
      if (!porMes[mes]) porMes[mes] = { materialNeto: 0, merma: 0 }
      porMes[mes].materialNeto += calc.materialNetoKg
      porMes[mes].merma += calc.materialConMermaKg - calc.materialNetoKg
    }
    return Object.entries(porMes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, v]) => ({ mes: mesLabel(mes), ...v }))
  }, [ordenesEnRango, moldeMap, materialMap, maquinaMap])

  // ── Reporte 4: Gantt ──────────────────────
  const dataGantt = useMemo(() => {
    const activas = ordenes.filter(o => o.estado !== 'entregado')
    const ref = new Date(fechaDesde).getTime()
    const resultado: GanttItem[] = []
    for (const o of activas) {
      const molde = moldeMap[o.moldeId]
      const material = materialMap[o.materialId]
      if (!molde || !material) continue
      const calc = calcularDatosOrden(o, molde, material, maquinaMap[o.maquinaId])
      resultado.push({
        folio: o.folio,
        producto: o.producto.length > 20 ? o.producto.slice(0, 20) + '…' : o.producto,
        fechaInicio: o.fechaInicio,
        fechaFin: calc.fechaEstimadaFin,
        margenDias: calc.margenDias,
        proyeccion: calc.proyeccionEstado,
        offset: Math.max(0, (new Date(o.fechaInicio).getTime() - ref) / 86400000),
        duracion: Math.max(1, Math.ceil(calc.tiempoEstimadoHoras / 24)),
      })
    }
    return resultado.sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio)).slice(0, 20)
  }, [ordenes, moldeMap, materialMap, maquinaMap, fechaDesde])

  // ── Helpers de color ──────────────────────
  const COLORS_MAQUINAS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444']

  // ── Render ────────────────────────────────
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Título */}
      <div>
        <h1 className={cls.pageTitle}>Estadísticas</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Análisis de producción y rendimiento</p>
      </div>

      {/* ── Selector de periodo ── */}
      <div className={`${cls.card} p-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mr-1">Periodo:</span>
          {PERIODOS.map(p => (
            <button
              key={p.valor}
              onClick={() => handlePeriodo(p.valor)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                periodoPreset === p.valor
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {periodoPreset === 'custom' && (
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">Desde:</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                className={`${cls.input} w-auto`}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">Hasta:</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                className={`${cls.input} w-auto`}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.valor}
            onClick={() => setTabActiva(tab.valor)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tabActiva === tab.valor
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <span>{tab.icono}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Reporte 1: Por Máquina ── */}
      {tabActiva === 'maquinas' && (
        <div className={`${cls.card} p-5`}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Producción por Máquina
            <span className="ml-2 text-xs font-normal text-gray-400">
              ({ordenesEnRango.filter(o => o.estado === 'entregado').length} órdenes entregadas en el periodo)
            </span>
          </h2>
          {dataMaquinas.length === 0 ? (
            <EmptyState icono="📊" titulo="Sin datos en el periodo" descripcion="No hay órdenes entregadas en el rango de fechas seleccionado." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={dataMaquinas} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tickFormatter={v => v.toLocaleString('es-MX')} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [typeof v === 'number' ? v.toLocaleString('es-MX') : '', 'Piezas']} />
                  <Bar dataKey="piezas" radius={[4, 4, 0, 0]}>
                    {dataMaquinas.map((_, i) => (
                      <Cell key={i} fill={COLORS_MAQUINAS[i % COLORS_MAQUINAS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-gray-500 dark:text-gray-400">Máquina</th>
                      <th className="text-right py-2 text-gray-500 dark:text-gray-400">Órdenes</th>
                      <th className="text-right py-2 text-gray-500 dark:text-gray-400">Piezas producidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataMaquinas.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 text-gray-800 dark:text-gray-200">{row.name}</td>
                        <td className="py-2 text-right text-gray-500">{row.ordenes}</td>
                        <td className="py-2 text-right font-semibold text-gray-900 dark:text-white">{formatearNumero(row.piezas, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Reporte 2: Por Producto ── */}
      {tabActiva === 'productos' && (
        <div className={`${cls.card} p-5`}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Producción por Producto / Molde
            <span className="ml-2 text-xs font-normal text-gray-400">(Top 10)</span>
          </h2>
          {dataProductos.length === 0 ? (
            <EmptyState icono="📊" titulo="Sin datos en el periodo" descripcion="No hay órdenes entregadas en el rango de fechas seleccionado." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={Math.max(240, dataProductos.length * 40)}>
                <BarChart data={dataProductos} layout="vertical" margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => v.toLocaleString('es-MX')} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [typeof v === 'number' ? v.toLocaleString('es-MX') : '', 'Piezas']} />
                  <Bar dataKey="piezas" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-gray-500">Producto</th>
                      <th className="text-left py-2 text-gray-500">Molde</th>
                      <th className="text-right py-2 text-gray-500">Piezas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataProductos.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 text-gray-800 dark:text-gray-200">{row.name}</td>
                        <td className="py-2 text-gray-500">{row.molde}</td>
                        <td className="py-2 text-right font-semibold text-gray-900 dark:text-white">{formatearNumero(row.piezas, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Reporte 3: Consumo de Material ── */}
      {tabActiva === 'materiales' && (
        <div className={`${cls.card} p-5`}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Consumo de Material por Periodo
          </h2>
          {dataMateriales.length === 0 ? (
            <EmptyState icono="🧪" titulo="Sin datos en el periodo" descripcion="No hay órdenes entregadas con molde y material asignados en el rango seleccionado." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={dataMateriales} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradNeto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradMerma" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `${v.toLocaleString('es-MX')} kg`} tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v) => [typeof v === 'number' ? `${formatearNumero(v)} kg` : '']} />
                  <Legend />
                  <Area
                    dataKey="materialNeto"
                    name="Material neto"
                    stackId="1"
                    stroke="#10b981"
                    fill="url(#gradNeto)"
                    strokeWidth={2}
                  />
                  <Area
                    dataKey="merma"
                    name="Merma"
                    stackId="1"
                    stroke="#f97316"
                    fill="url(#gradMerma)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-gray-500">Mes</th>
                      <th className="text-right py-2 text-gray-500">Material neto (kg)</th>
                      <th className="text-right py-2 text-gray-500">Merma (kg)</th>
                      <th className="text-right py-2 text-gray-500">Total con merma (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataMateriales.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 text-gray-800 dark:text-gray-200">{row.mes}</td>
                        <td className="py-2 text-right text-emerald-600 dark:text-emerald-400 font-medium">{formatearNumero(row.materialNeto)}</td>
                        <td className="py-2 text-right text-orange-500 dark:text-orange-400">{formatearNumero(row.merma)}</td>
                        <td className="py-2 text-right font-semibold text-gray-900 dark:text-white">{formatearNumero(row.materialNeto + row.merma)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Reporte 4: Gantt ── */}
      {tabActiva === 'gantt' && (
        <div className={`${cls.card} p-5`}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Proyección de Carga de Trabajo
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Órdenes activas ordenadas por fecha de inicio. Colores: verde = a tiempo, amarillo = ajustado, rojo = en riesgo.
          </p>
          {dataGantt.length === 0 ? (
            <EmptyState icono="📅" titulo="Sin órdenes activas" descripcion="No hay órdenes en producción, pendientes o con riesgo con molde y material asignados." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={Math.max(200, dataGantt.length * 36 + 40)}>
                <BarChart
                  data={dataGantt}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    label={{ value: 'Días desde inicio del periodo', position: 'insideBottom', offset: -5, fontSize: 11 }}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="folio"
                    width={70}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip content={<GanttTooltip />} />
                  {/* Barra offset (invisible) */}
                  <Bar dataKey="offset" stackId="gantt" fill="transparent" />
                  {/* Barra de duración (coloreada) */}
                  <Bar dataKey="duracion" stackId="gantt" radius={[0, 4, 4, 0]}>
                    {dataGantt.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.proyeccion === 'verde'
                            ? '#22c55e'
                            : entry.proyeccion === 'amarillo'
                            ? '#eab308'
                            : '#ef4444'
                        }
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Leyenda de colores */}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> A tiempo (&gt;2d)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" /> Ajustado (0–2d)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> En riesgo (&lt;0d)</span>
              </div>
              {/* Tabla de detalle */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-gray-500">Folio</th>
                      <th className="text-left py-2 text-gray-500">Producto</th>
                      <th className="text-right py-2 text-gray-500">Inicio</th>
                      <th className="text-right py-2 text-gray-500">Fin est.</th>
                      <th className="text-right py-2 text-gray-500">Holgura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataGantt.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 font-mono text-gray-600 dark:text-gray-400">{row.folio}</td>
                        <td className="py-2 text-gray-800 dark:text-gray-200">{row.producto}</td>
                        <td className="py-2 text-right text-gray-500">{formatearFecha(row.fechaInicio)}</td>
                        <td className="py-2 text-right text-gray-500">{formatearFecha(row.fechaFin)}</td>
                        <td className={`py-2 text-right font-semibold ${
                          row.proyeccion === 'verde' ? 'text-green-600 dark:text-green-400' :
                          row.proyeccion === 'amarillo' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {row.margenDias > 0 ? '+' : ''}{row.margenDias}d
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
