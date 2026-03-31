import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrdenes, eliminarOrden } from '../../hooks/useOrdenes'
import { useMoldes } from '../../hooks/useMoldes'
import { useMateriales } from '../../hooks/useMateriales'
import { useClientes } from '../../hooks/useClientes'
import { useApp } from '../../context/AppContext'
import { calcularDatosOrden, formatearFecha, formatearNumero } from '../../utils/calculos'
import { chipPrioridad, labelPrioridad, colorProyeccion, cls } from '../../utils/ui'
import SelectorEstadoOrden from '../../components/ui/SelectorEstadoOrden'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import SinPerfilActivo from '../../components/ui/SinPerfilActivo'
import type { EstadoOrden, PrioridadOrden, OrdenProduccion } from '../../types'

const ESTADOS_FILTRO: { valor: EstadoOrden | 'todos'; label: string }[] = [
  { valor: 'todos',        label: 'Todos' },
  { valor: 'pendiente',    label: 'Pendiente' },
  { valor: 'en_produccion',label: 'En producción' },
  { valor: 'listo',        label: 'Listo' },
  { valor: 'entregado',    label: 'Entregado' },
  { valor: 'con_riesgo',   label: 'Con riesgo' },
]

const PRIORIDADES_FILTRO: { valor: PrioridadOrden | 'todas'; label: string }[] = [
  { valor: 'todas', label: 'Todas' },
  { valor: 'alta',  label: 'Alta' },
  { valor: 'media', label: 'Media' },
  { valor: 'baja',  label: 'Baja' },
]

export default function OrdenesLista() {
  const { perfilActivoId } = useApp()
  const navigate = useNavigate()
  const ordenes = useOrdenes(perfilActivoId)
  const moldes = useMoldes(perfilActivoId)
  const materiales = useMateriales(perfilActivoId)
  const clientes = useClientes(perfilActivoId)

  const [filtroEstado, setFiltroEstado] = useState<EstadoOrden | 'todos'>('todos')
  const [filtroPrioridad, setFiltroPrioridad] = useState<PrioridadOrden | 'todas'>('todas')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [modalEliminar, setModalEliminar] = useState<{ abierto: boolean; orden: OrdenProduccion | null; cargando: boolean }>({
    abierto: false, orden: null, cargando: false,
  })

  if (!perfilActivoId) return <SinPerfilActivo />

  // Mapas para lookup rápido
  const moldeMap = useMemo(() => Object.fromEntries(moldes.map(m => [m.id, m])), [moldes])
  const materialMap = useMemo(() => Object.fromEntries(materiales.map(m => [m.id, m])), [materiales])
  const clienteMap = useMemo(() => Object.fromEntries(clientes.map(c => [c.id, c.nombre])), [clientes])

  // Calcular holgura de todas las órdenes
  const holguraMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof calcularDatosOrden> | null> = {}
    for (const o of ordenes) {
      const molde = moldeMap[o.moldeId]
      const material = materialMap[o.materialId]
      map[o.id] = molde && material ? calcularDatosOrden(o, molde, material) : null
    }
    return map
  }, [ordenes, moldeMap, materialMap])

  const filtradas = useMemo(() => ordenes.filter(o => {
    if (filtroEstado !== 'todos' && o.estado !== filtroEstado) return false
    if (filtroPrioridad !== 'todas' && o.prioridad !== filtroPrioridad) return false
    if (filtroCliente && o.clienteId !== filtroCliente) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      return o.folio.toLowerCase().includes(q) ||
        o.producto.toLowerCase().includes(q) ||
        (clienteMap[o.clienteId] || '').toLowerCase().includes(q)
    }
    return true
  }), [ordenes, filtroEstado, filtroPrioridad, filtroCliente, busqueda, clienteMap])

  const handleEliminar = async () => {
    if (!modalEliminar.orden) return
    setModalEliminar(m => ({ ...m, cargando: true }))
    await eliminarOrden(modalEliminar.orden.id)
    setModalEliminar({ abierto: false, orden: null, cargando: false })
  }

  const hayFiltros = filtroEstado !== 'todos' || filtroPrioridad !== 'todas' || filtroCliente || busqueda

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className={cls.pageHeader}>
        <div>
          <h1 className={cls.pageTitle}>Órdenes de Producción</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {ordenes.length} {ordenes.length === 1 ? 'orden' : 'órdenes'} en total
          </p>
        </div>
        <button onClick={() => navigate('/ordenes/nueva')} className={cls.btnPrimary}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva orden
        </button>
      </div>

      {/* Filtros */}
      {ordenes.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Estado */}
            <div className="flex gap-1 flex-wrap">
              {ESTADOS_FILTRO.map(e => (
                <button key={e.valor} onClick={() => setFiltroEstado(e.valor)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filtroEstado === e.valor
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}>
                  {e.label}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 hidden sm:block" />

            {/* Prioridad */}
            <div className="flex gap-1">
              {PRIORIDADES_FILTRO.map(p => (
                <button key={p.valor} onClick={() => setFiltroPrioridad(p.valor)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filtroPrioridad === p.valor
                      ? 'bg-gray-700 dark:bg-gray-300 text-white dark:text-gray-900'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input className={`${cls.input} sm:max-w-xs`} placeholder="Buscar por folio, producto o cliente..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}
              className={`${cls.select} sm:max-w-[200px]`}>
              <option value="">Todos los clientes</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            {hayFiltros && (
              <button onClick={() => { setFiltroEstado('todos'); setFiltroPrioridad('todas'); setFiltroCliente(''); setBusqueda('') }}
                className={cls.btnGhost}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lista */}
      {ordenes.length === 0 ? (
        <EmptyState icono="📋" titulo="No hay órdenes de producción"
          descripcion="Crea tu primera orden para comenzar a planificar la producción."
          accion={<button onClick={() => navigate('/ordenes/nueva')} className={cls.btnPrimary}>Nueva orden</button>} />
      ) : filtradas.length === 0 ? (
        <EmptyState icono="🔍" titulo="Sin resultados" descripcion="Prueba ajustando los filtros." />
      ) : (
        <div className={`${cls.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Folio</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Prioridad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Entrega</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Holgura</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtradas.map(orden => {
                  const calc = holguraMap[orden.id]
                  return (
                    <tr key={orden.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer transition-colors"
                      onClick={() => navigate(`/ordenes/${orden.id}`)}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-600 dark:text-gray-400">{orden.folio}</td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{orden.producto}</span>
                          {orden.tipoOrden === 'recurrente' && (
                            <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                              Rec.
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 md:hidden">{clienteMap[orden.clienteId] || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">{clienteMap[orden.clienteId] || '—'}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={chipPrioridad(orden.prioridad)}>{labelPrioridad(orden.prioridad)}</span>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <SelectorEstadoOrden ordenId={orden.id} estado={orden.estado} />
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                        {formatearFecha(orden.fechaEntrega)}
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        {calc ? (
                          <span className={`font-semibold text-sm ${colorProyeccion(calc.proyeccionEstado)}`}>
                            {calc.margenDias > 0 ? '+' : ''}{calc.margenDias}d
                          </span>
                        ) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => navigate(`/ordenes/${orden.id}`)} className={cls.btnGhost}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button onClick={() => setModalEliminar({ abierto: true, orden, cargando: false })}
                            className="inline-flex items-center p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filtradas.length < ordenes.length && (
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              Mostrando {filtradas.length} de {ordenes.length} órdenes
            </div>
          )}
        </div>
      )}

      <Modal
        abierto={modalEliminar.abierto}
        titulo="Eliminar orden"
        mensaje={
          <p>¿Eliminar la orden <strong className="text-gray-900 dark:text-white">{modalEliminar.orden?.folio}</strong> — {modalEliminar.orden?.producto}? Esta acción no se puede deshacer.</p>
        }
        labelConfirmar="Eliminar"
        cargando={modalEliminar.cargando}
        onConfirmar={handleEliminar}
        onCancelar={() => setModalEliminar({ abierto: false, orden: null, cargando: false })}
      />
    </div>
  )
}
