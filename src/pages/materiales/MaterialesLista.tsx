import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMateriales, eliminarMaterial } from '../../hooks/useMateriales'
import { useApp } from '../../context/AppContext'
import { formatearNumero } from '../../utils/calculos'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import SinPerfilActivo from '../../components/ui/SinPerfilActivo'
import { cls } from '../../utils/ui'
import type { Material } from '../../types'

export default function MaterialesLista() {
  const { perfilActivoId } = useApp()
  const navigate = useNavigate()
  const materiales = useMateriales(perfilActivoId)

  const [busqueda, setBusqueda] = useState('')
  const [modalEliminar, setModalEliminar] = useState<{ abierto: boolean; material: Material | null; cargando: boolean }>({
    abierto: false, material: null, cargando: false,
  })

  if (!perfilActivoId) return <SinPerfilActivo />

  const filtrados = materiales.filter(m =>
    m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.identificador.toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleEliminar = async () => {
    if (!modalEliminar.material) return
    setModalEliminar(m => ({ ...m, cargando: true }))
    await eliminarMaterial(modalEliminar.material.id)
    setModalEliminar({ abierto: false, material: null, cargando: false })
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className={cls.pageHeader}>
        <div>
          <h1 className={cls.pageTitle}>Materiales</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {materiales.length} {materiales.length === 1 ? 'material' : 'materiales'} registrados
          </p>
        </div>
        <button onClick={() => navigate('/materiales/nuevo')} className={cls.btnPrimary}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo material
        </button>
      </div>

      {/* Búsqueda */}
      {materiales.length > 0 && (
        <input
          className={cls.input}
          placeholder="Buscar por nombre o identificador..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      )}

      {/* Tabla */}
      {materiales.length === 0 ? (
        <EmptyState
          icono="📦"
          titulo="No hay materiales registrados"
          descripcion="Agrega los materiales que usa tu fábrica para comenzar."
          accion={
            <button onClick={() => navigate('/materiales/nuevo')} className={cls.btnPrimary}>
              Nuevo material
            </button>
          }
        />
      ) : filtrados.length === 0 ? (
        <EmptyState icono="🔍" titulo="Sin resultados" descripcion={`No se encontraron materiales con "${busqueda}".`} />
      ) : (
        <div className={`${cls.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Identificador</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Merma %</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Inventario (kg)</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Punto reorden (kg)</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtrados.map(mat => {
                  const bajoPunto = mat.inventarioActual <= mat.puntoReorden
                  return (
                    <tr
                      key={mat.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer transition-colors"
                      onClick={() => navigate(`/materiales/${mat.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">{mat.nombre}</span>
                          {bajoPunto && (
                            <span title="Inventario bajo el punto de reorden" className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                              ⚠ Bajo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{mat.identificador || '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">{formatearNumero(mat.mermaEstandar, 1)}%</td>
                      <td className="px-4 py-3 text-right font-mono hidden md:table-cell">
                        <span className={bajoPunto ? 'text-orange-600 dark:text-orange-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}>
                          {formatearNumero(mat.inventarioActual)} kg
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-500 dark:text-gray-400 hidden md:table-cell">
                        {formatearNumero(mat.puntoReorden)} kg
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => navigate(`/materiales/${mat.id}`)} className={cls.btnGhost} title="Ver detalle">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setModalEliminar({ abierto: true, material: mat, cargando: false })}
                            className="inline-flex items-center p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Eliminar"
                          >
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
        </div>
      )}

      <Modal
        abierto={modalEliminar.abierto}
        titulo="Eliminar material"
        mensaje={
          <p>¿Eliminar el material <strong className="text-gray-900 dark:text-white">{modalEliminar.material?.nombre}</strong>? Esta acción no se puede deshacer.</p>
        }
        labelConfirmar="Eliminar"
        cargando={modalEliminar.cargando}
        onConfirmar={handleEliminar}
        onCancelar={() => setModalEliminar({ abierto: false, material: null, cargando: false })}
      />
    </div>
  )
}
