import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMaquinas, eliminarMaquina } from '../../hooks/useMaquinas'
import { useApp } from '../../context/AppContext'
import { chipEstadoMaquina, labelEstadoMaquina, cls } from '../../utils/ui'
import { formatearNumero } from '../../utils/calculos'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import SinPerfilActivo from '../../components/ui/SinPerfilActivo'
import type { EstadoMaquina, Maquina } from '../../types'

const ESTADOS: { valor: EstadoMaquina | 'todos'; label: string }[] = [
  { valor: 'todos',         label: 'Todos' },
  { valor: 'activa',        label: 'Activas' },
  { valor: 'mantenimiento', label: 'En mantenimiento' },
  { valor: 'inactiva',      label: 'Inactivas' },
]

export default function MaquinasLista() {
  const { perfilActivoId } = useApp()
  const navigate = useNavigate()
  const maquinas = useMaquinas(perfilActivoId)

  const [filtroEstado, setFiltroEstado] = useState<EstadoMaquina | 'todos'>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [modalEliminar, setModalEliminar] = useState<{ abierto: boolean; maquina: Maquina | null; cargando: boolean }>({
    abierto: false, maquina: null, cargando: false,
  })

  if (!perfilActivoId) return <SinPerfilActivo />

  const filtradas = maquinas.filter(m => {
    const coincideEstado = filtroEstado === 'todos' || m.estado === filtroEstado
    const coincideBusqueda =
      m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.identificador.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.operador.toLowerCase().includes(busqueda.toLowerCase())
    return coincideEstado && coincideBusqueda
  })

  const handleEliminar = async () => {
    if (!modalEliminar.maquina) return
    setModalEliminar(m => ({ ...m, cargando: true }))
    await eliminarMaquina(modalEliminar.maquina.id)
    setModalEliminar({ abierto: false, maquina: null, cargando: false })
  }

  return (
    <div className="p-6 space-y-5">
      <div className={cls.pageHeader}>
        <div>
          <h1 className={cls.pageTitle}>Máquinas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {maquinas.length} {maquinas.length === 1 ? 'máquina' : 'máquinas'} registradas
          </p>
        </div>
        <button onClick={() => navigate('/maquinas/nueva')} className={cls.btnPrimary}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva máquina
        </button>
      </div>

      {maquinas.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className={`${cls.input} sm:max-w-xs`}
            placeholder="Buscar por nombre, código u operador..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <div className="flex gap-1 flex-wrap">
            {ESTADOS.map(e => (
              <button
                key={e.valor}
                onClick={() => setFiltroEstado(e.valor)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filtroEstado === e.valor
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {maquinas.length === 0 ? (
        <EmptyState
          icono="⚙️"
          titulo="No hay máquinas registradas"
          descripcion="Agrega las máquinas de inyección de tu fábrica."
          accion={<button onClick={() => navigate('/maquinas/nueva')} className={cls.btnPrimary}>Nueva máquina</button>}
        />
      ) : filtradas.length === 0 ? (
        <EmptyState icono="🔍" titulo="Sin resultados" descripcion="Prueba con otros filtros o términos de búsqueda." />
      ) : (
        <div className={`${cls.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Operador</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Tonelaje</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtradas.map(maq => (
                  <tr
                    key={maq.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer transition-colors"
                    onClick={() => navigate(`/maquinas/${maq.id}`)}
                  >
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs hidden sm:table-cell">{maq.identificador || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{maq.nombre}</td>
                    <td className="px-4 py-3"><span className={chipEstadoMaquina(maq.estado)}>{labelEstadoMaquina(maq.estado)}</span></td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">{maq.operador || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                      {maq.tonelaje ? `${formatearNumero(maq.tonelaje, 0)} ton` : '—'}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/maquinas/${maq.id}`)} className={cls.btnGhost} title="Ver detalle">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setModalEliminar({ abierto: true, maquina: maq, cargando: false })}
                          className="inline-flex items-center p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
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
        titulo="Eliminar máquina"
        mensaje={<p>¿Eliminar la máquina <strong className="text-gray-900 dark:text-white">{modalEliminar.maquina?.nombre}</strong>? Esta acción no se puede deshacer.</p>}
        labelConfirmar="Eliminar"
        cargando={modalEliminar.cargando}
        onConfirmar={handleEliminar}
        onCancelar={() => setModalEliminar({ abierto: false, maquina: null, cargando: false })}
      />
    </div>
  )
}
