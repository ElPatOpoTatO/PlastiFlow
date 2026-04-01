import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrden, eliminarOrden } from '../../hooks/useOrdenes'
import { useMolde } from '../../hooks/useMoldes'
import { useMaterial } from '../../hooks/useMateriales'
import { useMaquina } from '../../hooks/useMaquinas'
import { useCliente } from '../../hooks/useClientes'
import { calcularDatosOrden, formatearFecha, formatearNumero, formatearHoras } from '../../utils/calculos'
import { chipEstadoOrden, labelEstadoOrden, chipPrioridad, labelPrioridad, colorProyeccion, cls } from '../../utils/ui'
import SelectorEstadoOrden from '../../components/ui/SelectorEstadoOrden'
import Modal from '../../components/ui/Modal'
import OrdenesFormulario from './OrdenesFormulario'

interface Props { id: string }

const labelFrecuencia: Record<string, string> = {
  semanal: 'Semanal', quincenal: 'Quincenal',
  mensual: 'Mensual', personalizado: 'Personalizado',
}

export default function OrdenesDetalle({ id }: Props) {
  const navigate = useNavigate()
  const orden = useOrden(id)
  const molde = useMolde(orden?.moldeId)
  const material = useMaterial(orden?.materialId)
  const maquina = useMaquina(orden?.maquinaId)
  const cliente = useCliente(orden?.clienteId)

  const [editando, setEditando] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  const calculos = useMemo(() => {
    if (!orden || !molde || !material) return null
    return calcularDatosOrden(orden, molde, material, maquina)
  }, [orden, molde, material, maquina])

  if (orden === undefined) return <div className="p-6 text-sm text-gray-400">Cargando...</div>
  if (!orden) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Orden no encontrada.</p>
        <button onClick={() => navigate('/ordenes')} className={`${cls.btnSecondary} mt-3`}>Volver</button>
      </div>
    )
  }

  if (editando) {
    return <OrdenesFormulario id={id} onGuardado={() => setEditando(false)} onCancelado={() => setEditando(false)} />
  }

  const handleEliminar = async () => {
    setEliminando(true)
    await eliminarOrden(id)
    navigate('/ordenes')
  }

  // Barra de holgura: convierte margenDias a porcentaje visual (max ±14 días)
  const holguraPct = calculos
    ? Math.min(100, Math.max(0, ((calculos.margenDias + 14) / 28) * 100))
    : 50

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/ordenes')} className={cls.btnGhost}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm text-gray-400 dark:text-gray-500">{orden.folio}</span>
            <h1 className={`${cls.pageTitle} truncate`}>{orden.producto}</h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={chipPrioridad(orden.prioridad)}>{labelPrioridad(orden.prioridad)}</span>
            <SelectorEstadoOrden ordenId={orden.id} estado={orden.estado} />
            {orden.tipoOrden === 'recurrente' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                Recurrente · {labelFrecuencia[orden.frecuencia ?? ''] ?? orden.frecuencia}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => setEditando(true)} className={cls.btnSecondary}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editar
        </button>
        <button onClick={() => setModalEliminar(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm rounded-lg border border-red-200 dark:border-red-800 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Eliminar
        </button>
      </div>

      {/* Panel de proyección / holgura */}
      {calculos && (
        <div className={`rounded-xl border-2 p-5 ${
          calculos.proyeccionEstado === 'verde'
            ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
            : calculos.proyeccionEstado === 'amarillo'
            ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
            : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Proyección de producción</h2>
            <span className={`text-sm font-bold ${colorProyeccion(calculos.proyeccionEstado)}`}>
              {calculos.proyeccionEstado === 'verde' ? '✅ A tiempo' :
               calculos.proyeccionEstado === 'amarillo' ? '⚠️ Holgura ajustada' : '🔴 En riesgo de retraso'}
            </span>
          </div>

          {/* Barra de holgura */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Inicio: {formatearFecha(orden.fechaInicio)}</span>
              <span className={`font-semibold ${colorProyeccion(calculos.proyeccionEstado)}`}>
                {calculos.margenDias > 0 ? `+${calculos.margenDias}` : calculos.margenDias} días de margen
              </span>
              <span>Entrega: {formatearFecha(orden.fechaEntrega)}</span>
            </div>
            <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  calculos.proyeccionEstado === 'verde' ? 'bg-green-500' :
                  calculos.proyeccionEstado === 'amarillo' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${holguraPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Fin estimado: <strong className="text-gray-700 dark:text-gray-200">{formatearFecha(calculos.fechaEstimadaFin)}</strong>
            </p>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Piezas / hora', valor: calculos.piezasPorHora.toLocaleString('es-MX') },
              { label: 'Tiempo estimado', valor: formatearHoras(calculos.tiempoEstimadoHoras) },
              { label: 'Material neto', valor: `${formatearNumero(calculos.materialNetoKg)} kg` },
              { label: 'Con merma', valor: `${formatearNumero(calculos.materialConMermaKg)} kg` },
            ].map(m => (
              <div key={m.label}>
                <p className="text-xs text-gray-500 dark:text-gray-400">{m.label}</p>
                <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{m.valor}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Datos de la orden */}
      <div className={`${cls.card} p-5`}>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Datos de la orden</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
          <div><dt className="text-gray-400 dark:text-gray-500">Cliente</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{cliente?.nombre ?? '—'}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Cantidad requerida</dt><dd className="font-semibold text-gray-900 dark:text-white mt-0.5">{orden.cantidadRequerida.toLocaleString('es-MX')} piezas</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Estado</dt><dd className="mt-0.5"><span className={chipEstadoOrden(orden.estado)}>{labelEstadoOrden(orden.estado)}</span></dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Molde</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{molde?.nombre ?? '—'}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Material</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{material?.nombre ?? '—'}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Máquina</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{maquina?.nombre ?? 'Sin asignar'}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Fecha inicio</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{formatearFecha(orden.fechaInicio)}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Fecha entrega</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{formatearFecha(orden.fechaEntrega)}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Creada</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{formatearFecha(orden.fechaCreacion)}</dd></div>
        </dl>
        {orden.notasInternas && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <dt className="text-xs text-gray-400 dark:text-gray-500 mb-1">Notas internas</dt>
            <dd className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{orden.notasInternas}</dd>
          </div>
        )}
      </div>

      <Modal
        abierto={modalEliminar}
        titulo="Eliminar orden"
        mensaje={
          <p>¿Eliminar la orden <strong className="text-gray-900 dark:text-white">{orden.folio}</strong> — {orden.producto}? Esta acción no se puede deshacer.</p>
        }
        labelConfirmar="Eliminar"
        cargando={eliminando}
        onConfirmar={handleEliminar}
        onCancelar={() => setModalEliminar(false)}
      />
    </div>
  )
}
