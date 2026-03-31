import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMaterial, eliminarMaterial } from '../../hooks/useMateriales'
import { formatearFecha, formatearNumero } from '../../utils/calculos'
import Modal from '../../components/ui/Modal'
import MaterialesFormulario from './MaterialesFormulario'
import { cls } from '../../utils/ui'

interface Props { id: string }

export default function MaterialesDetalle({ id }: Props) {
  const navigate = useNavigate()
  const material = useMaterial(id)
  const [editando, setEditando] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  if (material === undefined) {
    return <div className="p-6 text-sm text-gray-400">Cargando...</div>
  }
  if (material === null || !material) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Material no encontrado.</p>
        <button onClick={() => navigate('/materiales')} className={`${cls.btnSecondary} mt-3`}>Volver</button>
      </div>
    )
  }

  if (editando) {
    return <MaterialesFormulario id={id} onGuardado={() => setEditando(false)} onCancelado={() => setEditando(false)} />
  }

  const bajoPunto = material.inventarioActual <= material.puntoReorden

  const handleEliminar = async () => {
    setEliminando(true)
    await eliminarMaterial(id)
    navigate('/materiales')
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/materiales')} className={cls.btnGhost}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className={cls.pageTitle}>{material.nombre}</h1>
          {material.identificador && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{material.identificador}</p>
          )}
        </div>
        <button onClick={() => setEditando(true)} className={cls.btnSecondary}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editar
        </button>
        <button
          onClick={() => setModalEliminar(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm rounded-lg border border-red-200 dark:border-red-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Eliminar
        </button>
      </div>

      {/* Datos principales */}
      <div className={`${cls.card} p-5`}>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Datos del material</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div>
            <dt className="text-gray-400 dark:text-gray-500">Merma estándar</dt>
            <dd className="font-semibold text-gray-900 dark:text-white mt-0.5">{formatearNumero(material.mermaEstandar, 1)}%</dd>
          </div>
          <div>
            <dt className="text-gray-400 dark:text-gray-500">Creado</dt>
            <dd className="font-medium text-gray-700 dark:text-gray-300 mt-0.5">{formatearFecha(material.fechaCreacion)}</dd>
          </div>
          <div>
            <dt className="text-gray-400 dark:text-gray-500">Inventario actual</dt>
            <dd className={`font-semibold mt-0.5 ${bajoPunto ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
              {formatearNumero(material.inventarioActual)} kg
              {bajoPunto && <span className="ml-2 text-xs font-medium">⚠ Bajo punto de reorden</span>}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400 dark:text-gray-500">Punto de reorden</dt>
            <dd className="font-medium text-gray-700 dark:text-gray-300 mt-0.5">{formatearNumero(material.puntoReorden)} kg</dd>
          </div>
        </dl>
        {material.notas && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <dt className="text-xs text-gray-400 dark:text-gray-500 mb-1">Notas</dt>
            <dd className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{material.notas}</dd>
          </div>
        )}
      </div>

      {/* Fórmula de merma */}
      <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Cómo se aplica la merma en los cálculos:</p>
        <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">
          Material real = Material teórico × (1 + {formatearNumero(material.mermaEstandar, 1)}% / 100) = Material teórico × {formatearNumero(1 + material.mermaEstandar / 100, 4)}
        </p>
      </div>

      <Modal
        abierto={modalEliminar}
        titulo="Eliminar material"
        mensaje={<p>¿Eliminar <strong className="text-gray-900 dark:text-white">{material.nombre}</strong>? Esta acción no se puede deshacer.</p>}
        labelConfirmar="Eliminar"
        cargando={eliminando}
        onConfirmar={handleEliminar}
        onCancelar={() => setModalEliminar(false)}
      />
    </div>
  )
}
