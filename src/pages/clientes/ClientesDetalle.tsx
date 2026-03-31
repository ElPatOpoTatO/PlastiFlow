import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCliente, eliminarCliente } from '../../hooks/useClientes'
import { useApp } from '../../context/AppContext'
import { db } from '../../db/database'
import { chipEstadoOrden, labelEstadoOrden, chipPrioridad, labelPrioridad, cls } from '../../utils/ui'
import { formatearFecha } from '../../utils/calculos'
import Modal from '../../components/ui/Modal'
import ClientesFormulario from './ClientesFormulario'

interface Props { id: string }

export default function ClientesDetalle({ id }: Props) {
  const { perfilActivoId } = useApp()
  const navigate = useNavigate()
  const cliente = useCliente(id)
  const [editando, setEditando] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  const ordenes = useLiveQuery<import('../../types').OrdenProduccion[]>(
    async () => perfilActivoId
      ? db.ordenes.where('clienteId').equals(id).toArray()
      : [],
    [id, perfilActivoId]
  ) ?? []

  if (cliente === undefined) return <div className="p-6 text-sm text-gray-400">Cargando...</div>
  if (!cliente) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Cliente no encontrado.</p>
        <button onClick={() => navigate('/clientes')} className={`${cls.btnSecondary} mt-3`}>Volver</button>
      </div>
    )
  }

  if (editando) {
    return <ClientesFormulario id={id} onGuardado={() => setEditando(false)} onCancelado={() => setEditando(false)} />
  }

  const handleEliminar = async () => {
    setEliminando(true)
    await eliminarCliente(id)
    navigate('/clientes')
  }

  const ordenesActivas = ordenes.filter(o => o.estado !== 'entregado')
  const historial = ordenes.filter(o => o.estado === 'entregado')

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/clientes')} className={cls.btnGhost}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className={cls.pageTitle}>{cliente.nombre}</h1>
          {cliente.identificador && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{cliente.identificador}</p>}
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

      {/* Datos */}
      <div className={`${cls.card} p-5`}>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Datos del cliente</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div><dt className="text-gray-400 dark:text-gray-500">Identificador</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{cliente.identificador || '—'}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Creado</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{formatearFecha(cliente.fechaCreacion)}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Total de órdenes</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{ordenes.length}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Órdenes activas</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{ordenesActivas.length}</dd></div>
        </dl>
        {cliente.notas && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <dt className="text-xs text-gray-400 dark:text-gray-500 mb-1">Notas</dt>
            <dd className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{cliente.notas}</dd>
          </div>
        )}
      </div>

      {/* Órdenes activas */}
      {ordenesActivas.length > 0 && (
        <div className={`${cls.card} p-5`}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Órdenes activas <span className="text-xs font-normal text-gray-400">({ordenesActivas.length})</span>
          </h2>
          <div className="space-y-1.5">
            {ordenesActivas.map(o => (
              <div key={o.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm">
                <span className="font-mono text-xs text-gray-400 shrink-0">{o.folio}</span>
                <span className="font-medium text-gray-800 dark:text-gray-200 truncate flex-1">{o.producto}</span>
                <span className={chipPrioridad(o.prioridad)}>{labelPrioridad(o.prioridad)}</span>
                <span className={chipEstadoOrden(o.estado)}>{labelEstadoOrden(o.estado)}</span>
                <span className="text-xs text-gray-400 shrink-0">{formatearFecha(o.fechaEntrega)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <div className={`${cls.card} p-5`}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Historial <span className="text-xs font-normal text-gray-400">({historial.length} entregadas)</span>
          </h2>
          <div className="space-y-1.5">
            {historial.slice(0, 15).map(o => (
              <div key={o.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm">
                <span className="font-mono text-xs text-gray-400 shrink-0">{o.folio}</span>
                <span className="truncate flex-1 text-gray-600 dark:text-gray-400">{o.producto}</span>
                <span className="text-xs text-gray-400 shrink-0">{formatearFecha(o.fechaEntrega)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {ordenes.length === 0 && (
        <div className={`${cls.card} p-5 text-center`}>
          <p className="text-sm text-gray-400 dark:text-gray-500">Este cliente no tiene órdenes de producción registradas.</p>
        </div>
      )}

      <Modal
        abierto={modalEliminar}
        titulo="Eliminar cliente"
        mensaje={<p>¿Eliminar al cliente <strong className="text-gray-900 dark:text-white">{cliente.nombre}</strong>? Esta acción no se puede deshacer.</p>}
        labelConfirmar="Eliminar"
        cargando={eliminando}
        onConfirmar={handleEliminar}
        onCancelar={() => setModalEliminar(false)}
      />
    </div>
  )
}
