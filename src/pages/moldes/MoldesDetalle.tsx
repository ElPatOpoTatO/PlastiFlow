import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMolde, eliminarMolde } from '../../hooks/useMoldes'
import { useMateriales } from '../../hooks/useMateriales'
import { useApp } from '../../context/AppContext'
import { useConfiguracion } from '../../hooks/usePerfiles'
import { calcularDatosMolde, calcularPanelMolde, formatearFecha, formatearNumero, formatearHoras } from '../../utils/calculos'
import Modal from '../../components/ui/Modal'
import MoldesFormulario from './MoldesFormulario'
import { cls } from '../../utils/ui'

interface Props { id: string }

export default function MoldesDetalle({ id }: Props) {
  const { perfilActivoId } = useApp()
  const navigate = useNavigate()
  const molde = useMolde(id)
  const materiales = useMateriales(perfilActivoId)
  const config = useConfiguracion(perfilActivoId)
  const [editando, setEditando] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  if (molde === undefined) return <div className="p-6 text-sm text-gray-400">Cargando...</div>
  if (!molde) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Molde no encontrado.</p>
        <button onClick={() => navigate('/moldes')} className={`${cls.btnSecondary} mt-3`}>Volver</button>
      </div>
    )
  }

  if (editando) {
    return <MoldesFormulario id={id} onGuardado={() => setEditando(false)} onCancelado={() => setEditando(false)} />
  }

  const handleEliminar = async () => {
    setEliminando(true)
    await eliminarMolde(id)
    navigate('/moldes')
  }

  const matMap = Object.fromEntries(materiales.map(m => [m.id, m]))
  const calculos = calcularDatosMolde(molde)
  const materialesSeleccionados = molde.materialesCompatibles
    .map(mid => matMap[mid])
    .filter(Boolean)
  const primerMaterial = materialesSeleccionados[0] ?? null
  const panel = calcularPanelMolde(molde, config.horasLaboralesDia, config.diasHabilMes, primerMaterial)

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/moldes')} className={cls.btnGhost}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className={cls.pageTitle}>{molde.nombre}</h1>
          {molde.identificador && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{molde.identificador}</p>}
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

      {/* Panel de producción */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        {primerMaterial && (
          <p className="text-xs text-blue-500 dark:text-blue-400 mb-3">
            Material con merma: <span className="font-medium">{primerMaterial.nombre}</span>
          </p>
        )}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">Por hora</div>
          <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">Por día ({config.horasLaboralesDia} h)</div>
          <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">Por mes ({config.diasHabilMes} días)</div>

          <div className="bg-white dark:bg-blue-900/30 rounded-lg p-2">
            <p className="text-[10px] text-blue-400 mb-0.5">Piezas</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">{panel.piezasPorHora.toLocaleString('es-MX')}</p>
          </div>
          <div className="bg-white dark:bg-blue-900/30 rounded-lg p-2">
            <p className="text-[10px] text-blue-400 mb-0.5">Piezas</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">{panel.piezasPorDia.toLocaleString('es-MX')}</p>
          </div>
          <div className="bg-white dark:bg-blue-900/30 rounded-lg p-2">
            <p className="text-[10px] text-blue-400 mb-0.5">Piezas</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">{panel.piezasPorMes.toLocaleString('es-MX')}</p>
          </div>

          <div className="bg-white dark:bg-blue-900/30 rounded-lg p-2">
            <p className="text-[10px] text-blue-400 mb-0.5">Material</p>
            <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">{formatearNumero(panel.kgPorHora)} kg</p>
          </div>
          <div className="bg-white dark:bg-blue-900/30 rounded-lg p-2">
            <p className="text-[10px] text-blue-400 mb-0.5">Material</p>
            <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">{formatearNumero(panel.kgPorDia)} kg</p>
          </div>
          <div className="bg-white dark:bg-blue-900/30 rounded-lg p-2">
            <p className="text-[10px] text-blue-400 mb-0.5">Material</p>
            <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">{formatearNumero(panel.kgPorMes)} kg</p>
          </div>
        </div>
      </div>

      {/* Datos del molde */}
      <div className={`${cls.card} p-5`}>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Datos del molde</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
          <div><dt className="text-gray-400 dark:text-gray-500">Nº de cavidades</dt><dd className="font-semibold text-gray-900 dark:text-white mt-0.5">{molde.numeroCavidades}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Tiempo de ciclo</dt><dd className="font-semibold text-gray-900 dark:text-white mt-0.5">{molde.tiempoCiclo}s · {formatearHoras(molde.tiempoCiclo / 3600)}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Peso por pieza</dt><dd className="font-semibold text-gray-900 dark:text-white mt-0.5">{formatearNumero(molde.pesoPorDisparo)} g</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Dimensiones</dt>
            <dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">
              {molde.dimensionAncho}×{molde.dimensionAlto}×{molde.dimensionProfundidad} mm
            </dd>
          </div>
          <div><dt className="text-gray-400 dark:text-gray-500">Producto(s)</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{molde.productos || '—'}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Eficiencia</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{molde.eficiencia ? `${formatearNumero(molde.eficiencia, 0)}%` : '—'}</dd></div>
          <div><dt className="text-gray-400 dark:text-gray-500">Creado</dt><dd className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{formatearFecha(molde.fechaCreacion)}</dd></div>
        </dl>
        {molde.notas && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <dt className="text-xs text-gray-400 dark:text-gray-500 mb-1">Notas</dt>
            <dd className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{molde.notas}</dd>
          </div>
        )}
      </div>

      {/* Material por hora con merma por material */}
      {materialesSeleccionados.length > 0 && (
        <div className={`${cls.card} p-5`}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Material / hora con merma por material</h2>
          <div className="space-y-2">
            {materialesSeleccionados.map(mat => {
              const c = calcularDatosMolde(molde, mat)
              return (
                <div key={mat.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-200 flex-1">{mat.nombre}</span>
                  <span className="text-xs text-gray-400">Merma {formatearNumero(mat.mermaEstandar, 1)}%</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {c.materialPorHoraConMermaKg !== null ? `${formatearNumero(c.materialPorHoraConMermaKg)} kg/hr` : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Modal
        abierto={modalEliminar}
        titulo="Eliminar molde"
        mensaje={<p>¿Eliminar el molde <strong className="text-gray-900 dark:text-white">{molde.nombre}</strong>? Esta acción no se puede deshacer.</p>}
        labelConfirmar="Eliminar"
        cargando={eliminando}
        onConfirmar={handleEliminar}
        onCancelar={() => setModalEliminar(false)}
      />
    </div>
  )
}
