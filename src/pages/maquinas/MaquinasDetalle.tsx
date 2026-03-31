import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMaquina, eliminarMaquina } from '../../hooks/useMaquinas'
import { useApp } from '../../context/AppContext'
import { db } from '../../db/database'
import { chipEstadoMaquina, labelEstadoMaquina, labelEstadoOrden, chipEstadoOrden, cls } from '../../utils/ui'
import { formatearFecha, formatearNumero, dimensionMaximaMolde, esMoldeCompatibleConMaquina } from '../../utils/calculos'
import Modal from '../../components/ui/Modal'
import MaquinasFormulario from './MaquinasFormulario'

interface Props { id: string }

export default function MaquinasDetalle({ id }: Props) {
  const { perfilActivoId } = useApp()
  const navigate = useNavigate()
  const maquina = useMaquina(id)
  const [editando, setEditando] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  // Órdenes asociadas
  const ordenes = useLiveQuery<import('../../types').OrdenProduccion[]>(
    async () => perfilActivoId
      ? db.ordenes.where('maquinaId').equals(id).toArray()
      : [],
    [id, perfilActivoId]
  ) ?? []

  // Moldes compatibles
  const moldesCompatibles = useLiveQuery<import('../../types').Molde[]>(
    async () => {
      if (!perfilActivoId || !maquina) return []
      const todos = await db.moldes.where('perfilId').equals(perfilActivoId).toArray()
      return todos.filter(m => esMoldeCompatibleConMaquina(m, maquina))
    },
    [id, perfilActivoId, maquina]
  ) ?? []

  // Clientes para mostrar nombre en órdenes
  const clientes = useLiveQuery<import('../../types').Cliente[]>(
    async () => perfilActivoId ? db.clientes.where('perfilId').equals(perfilActivoId).toArray() : [],
    [perfilActivoId]
  ) ?? []
  const clienteMap = Object.fromEntries(clientes.map(c => [c.id, c.nombre]))

  if (maquina === undefined) return <div className="p-6 text-sm text-gray-400">Cargando...</div>
  if (!maquina) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Máquina no encontrada.</p>
        <button onClick={() => navigate('/maquinas')} className={`${cls.btnSecondary} mt-3`}>Volver</button>
      </div>
    )
  }

  if (editando) {
    return <MaquinasFormulario id={id} onGuardado={() => setEditando(false)} onCancelado={() => setEditando(false)} />
  }

  const handleEliminar = async () => {
    setEliminando(true)
    await eliminarMaquina(id)
    navigate('/maquinas')
  }

  const ordenesActivas = ordenes.filter(o => o.estado !== 'entregado')
  const ordenesHistorial = ordenes.filter(o => o.estado === 'entregado')

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/maquinas')} className={cls.btnGhost}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className={cls.pageTitle}>{maquina.nombre}</h1>
            <span className={chipEstadoMaquina(maquina.estado)}>{labelEstadoMaquina(maquina.estado)}</span>
          </div>
          {maquina.identificador && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{maquina.identificador}</p>}
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
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Datos de la máquina</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
          <div><dt className="text-gray-400 dark:text-gray-500">Operador</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{maquina.operador || '—'}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Tonelaje</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{maquina.tonelaje ? `${formatearNumero(maquina.tonelaje, 0)} ton` : '—'}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Eficiencia</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{maquina.eficiencia ? `${formatearNumero(maquina.eficiencia, 0)}%` : '—'}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Dim. máx. molde (mm)</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{(maquina.moldeAnchoMax || maquina.moldeAltoMax || maquina.moldeEspesorMax) ? `${maquina.moldeAnchoMax || '?'}×${maquina.moldeAltoMax || '?'}×${maquina.moldeEspesorMax || '?'}` : '—'}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Cap. inyección</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{maquina.capacidadInyeccionCm3 ? `${formatearNumero(maquina.capacidadInyeccionCm3, 0)} cm³` : '—'}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Peso iny. máx.</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{maquina.pesoInyeccionMaxG ? `${formatearNumero(maquina.pesoInyeccionMaxG, 0)} g` : '—'}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Dist. entre columnas</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{maquina.distanciaEntreColumnasMm ? `${formatearNumero(maquina.distanciaEntreColumnasMm, 0)} mm` : '—'}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Apertura máxima</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{maquina.aperturaMaximaMm ? `${formatearNumero(maquina.aperturaMaximaMm, 0)} mm` : '—'}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Horas acumuladas</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{formatearNumero(maquina.horasOperacion, 0)} hrs</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Creada</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{formatearFecha(maquina.fechaCreacion)}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Modificada</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{formatearFecha(maquina.fechaModificacion)}</dd></div>
        </dl>
        {maquina.notas && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <dt className="text-xs text-gray-400 dark:text-gray-500 mb-1">Notas</dt>
            <dd className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{maquina.notas}</dd>
          </div>
        )}
      </div>

      {/* Moldes compatibles */}
      <div className={`${cls.card} p-5`}>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Moldes compatibles
          <span className="ml-2 text-xs font-normal text-gray-400">({moldesCompatibles.length})</span>
        </h2>
        {(!maquina.moldeAnchoMax && !maquina.moldeAltoMax && !maquina.moldeEspesorMax) ? (
          <p className="text-xs text-gray-400 dark:text-gray-500">Define las dimensiones máximas de molde para calcular compatibilidad.</p>
        ) : moldesCompatibles.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500">No hay moldes compatibles con esta máquina.</p>
        ) : (
          <div className="space-y-1.5">
            {moldesCompatibles.map(m => (
              <div key={m.id} className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm">
                <span className="font-medium text-gray-800 dark:text-gray-200">{m.nombre}</span>
                {m.identificador && <span className="text-gray-400 dark:text-gray-500 font-mono text-xs">{m.identificador}</span>}
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{formatearNumero(dimensionMaximaMolde(m), 0)} mm</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Órdenes activas */}
      {ordenesActivas.length > 0 && (
        <div className={`${cls.card} p-5`}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Órdenes activas ({ordenesActivas.length})</h2>
          <div className="space-y-1.5">
            {ordenesActivas.map(o => (
              <div key={o.id} className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm">
                <span className="font-mono text-xs text-gray-400">{o.folio}</span>
                <span className="font-medium text-gray-800 dark:text-gray-200 truncate flex-1">{o.producto}</span>
                <span className="text-xs text-gray-500">{clienteMap[o.clienteId] || '—'}</span>
                <span className={chipEstadoOrden(o.estado)}>{labelEstadoOrden(o.estado)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial */}
      {ordenesHistorial.length > 0 && (
        <div className={`${cls.card} p-5`}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Historial de órdenes ({ordenesHistorial.length})</h2>
          <div className="space-y-1.5">
            {ordenesHistorial.slice(0, 10).map(o => (
              <div key={o.id} className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm">
                <span className="font-mono text-xs text-gray-400">{o.folio}</span>
                <span className="truncate flex-1 text-gray-600 dark:text-gray-400">{o.producto}</span>
                <span className="text-xs text-gray-400">{formatearFecha(o.fechaEntrega)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        abierto={modalEliminar}
        titulo="Eliminar máquina"
        mensaje={<p>¿Eliminar la máquina <strong className="text-gray-900 dark:text-white">{maquina.nombre}</strong>? Esta acción no se puede deshacer.</p>}
        labelConfirmar="Eliminar"
        cargando={eliminando}
        onConfirmar={handleEliminar}
        onCancelar={() => setModalEliminar(false)}
      />
    </div>
  )
}
