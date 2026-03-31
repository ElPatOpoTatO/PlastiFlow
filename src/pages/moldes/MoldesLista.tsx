import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMoldes, eliminarMolde } from '../../hooks/useMoldes'
import { useMateriales } from '../../hooks/useMateriales'
import { useApp } from '../../context/AppContext'
import { calcularPiezasPorHora } from '../../utils/calculos'
import { cls } from '../../utils/ui'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import SinPerfilActivo from '../../components/ui/SinPerfilActivo'
import type { Molde } from '../../types'

export default function MoldesLista() {
  const { perfilActivoId } = useApp()
  const navigate = useNavigate()
  const moldes = useMoldes(perfilActivoId)
  const materiales = useMateriales(perfilActivoId)
  const matMap = Object.fromEntries(materiales.map(m => [m.id, m.nombre]))

  const [busqueda, setBusqueda] = useState('')
  const [modalEliminar, setModalEliminar] = useState<{ abierto: boolean; molde: Molde | null; cargando: boolean }>({
    abierto: false, molde: null, cargando: false,
  })

  if (!perfilActivoId) return <SinPerfilActivo />

  const filtrados = moldes.filter(m =>
    m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.identificador.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.productos.toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleEliminar = async () => {
    if (!modalEliminar.molde) return
    setModalEliminar(m => ({ ...m, cargando: true }))
    await eliminarMolde(modalEliminar.molde.id)
    setModalEliminar({ abierto: false, molde: null, cargando: false })
  }

  return (
    <div className="p-6 space-y-5">
      <div className={cls.pageHeader}>
        <div>
          <h1 className={cls.pageTitle}>Moldes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {moldes.length} {moldes.length === 1 ? 'molde' : 'moldes'} registrados
          </p>
        </div>
        <button onClick={() => navigate('/moldes/nuevo')} className={cls.btnPrimary}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo molde
        </button>
      </div>

      {moldes.length > 0 && (
        <input className={cls.input} placeholder="Buscar por nombre, código o producto..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      )}

      {moldes.length === 0 ? (
        <EmptyState icono="🔷" titulo="No hay moldes registrados" descripcion="Agrega los moldes de inyección de tu fábrica."
          accion={<button onClick={() => navigate('/moldes/nuevo')} className={cls.btnPrimary}>Nuevo molde</button>} />
      ) : filtrados.length === 0 ? (
        <EmptyState icono="🔍" titulo="Sin resultados" descripcion={`No se encontraron moldes con "${busqueda}".`} />
      ) : (
        <div className={`${cls.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Producto(s)</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Cavidades</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Piezas/hr</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Materiales</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtrados.map(molde => {
                  const pph = calcularPiezasPorHora(molde)
                  const matNombres = molde.materialesCompatibles
                    .map(mid => matMap[mid])
                    .filter(Boolean)
                  return (
                    <tr key={molde.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer transition-colors"
                      onClick={() => navigate(`/moldes/${molde.id}`)}>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs hidden sm:table-cell">{molde.identificador || '—'}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{molde.nombre}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell truncate max-w-[150px]">{molde.productos || '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300 hidden sm:table-cell">{molde.numeroCavidades}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {pph > 0 ? pph.toLocaleString('es-MX') : '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {matNombres.length === 0
                            ? <span className="text-gray-400 text-xs">—</span>
                            : matNombres.slice(0, 3).map(n => (
                              <span key={n} className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{n}</span>
                            ))}
                          {matNombres.length > 3 && <span className="text-xs text-gray-400">+{matNombres.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => navigate(`/moldes/${molde.id}`)} className={cls.btnGhost}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button onClick={() => setModalEliminar({ abierto: true, molde, cargando: false })}
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
        </div>
      )}

      <Modal
        abierto={modalEliminar.abierto}
        titulo="Eliminar molde"
        mensaje={<p>¿Eliminar el molde <strong className="text-gray-900 dark:text-white">{modalEliminar.molde?.nombre}</strong>?</p>}
        labelConfirmar="Eliminar"
        cargando={modalEliminar.cargando}
        onConfirmar={handleEliminar}
        onCancelar={() => setModalEliminar({ abierto: false, molde: null, cargando: false })}
      />
    </div>
  )
}
