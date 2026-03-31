import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientes, eliminarCliente } from '../../hooks/useClientes'
import { useApp } from '../../context/AppContext'
import { cls } from '../../utils/ui'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import SinPerfilActivo from '../../components/ui/SinPerfilActivo'
import type { Cliente } from '../../types'

export default function ClientesLista() {
  const { perfilActivoId } = useApp()
  const navigate = useNavigate()
  const clientes = useClientes(perfilActivoId)
  const [busqueda, setBusqueda] = useState('')
  const [modalEliminar, setModalEliminar] = useState<{ abierto: boolean; cliente: Cliente | null; cargando: boolean }>({
    abierto: false, cliente: null, cargando: false,
  })

  if (!perfilActivoId) return <SinPerfilActivo />

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.identificador.toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleEliminar = async () => {
    if (!modalEliminar.cliente) return
    setModalEliminar(m => ({ ...m, cargando: true }))
    await eliminarCliente(modalEliminar.cliente.id)
    setModalEliminar({ abierto: false, cliente: null, cargando: false })
  }

  return (
    <div className="p-6 space-y-5">
      <div className={cls.pageHeader}>
        <div>
          <h1 className={cls.pageTitle}>Clientes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'} registrados
          </p>
        </div>
        <button onClick={() => navigate('/clientes/nuevo')} className={cls.btnPrimary}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo cliente
        </button>
      </div>

      {clientes.length > 0 && (
        <input className={cls.input} placeholder="Buscar por nombre o identificador..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      )}

      {clientes.length === 0 ? (
        <EmptyState icono="👥" titulo="No hay clientes registrados" descripcion="Agrega los clientes de tu fábrica."
          accion={<button onClick={() => navigate('/clientes/nuevo')} className={cls.btnPrimary}>Nuevo cliente</button>} />
      ) : filtrados.length === 0 ? (
        <EmptyState icono="🔍" titulo="Sin resultados" />
      ) : (
        <div className={`${cls.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre / Empresa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Identificador</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Notas</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtrados.map(cliente => (
                  <tr key={cliente.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer transition-colors"
                    onClick={() => navigate(`/clientes/${cliente.id}`)}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{cliente.nombre}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell font-mono text-xs">{cliente.identificador || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell truncate max-w-[200px]">
                      {cliente.notas || '—'}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/clientes/${cliente.id}`)} className={cls.btnGhost}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button onClick={() => setModalEliminar({ abierto: true, cliente, cargando: false })}
                          className="inline-flex items-center p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        abierto={modalEliminar.abierto}
        titulo="Eliminar cliente"
        mensaje={<p>¿Eliminar al cliente <strong className="text-gray-900 dark:text-white">{modalEliminar.cliente?.nombre}</strong>?</p>}
        labelConfirmar="Eliminar"
        cargando={modalEliminar.cargando}
        onConfirmar={handleEliminar}
        onCancelar={() => setModalEliminar({ abierto: false, cliente: null, cargando: false })}
      />
    </div>
  )
}
