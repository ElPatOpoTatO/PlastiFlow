// ============================================================
// PlastiFlow — Página: Configuración y Gestión de Perfiles
// ============================================================

import { useState, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { useListaPerfiles, crearPerfil, duplicarPerfil, eliminarPerfil, useConfiguracion, actualizarConfiguracion } from '../../hooks/usePerfiles'
import { exportarPerfil, importarPerfil } from '../../utils/perfil'
import { formatearFecha } from '../../utils/calculos'
import Modal from '../../components/ui/Modal'
import FormularioPerfil from '../../components/ui/FormularioPerfil'
import { cls } from '../../utils/ui'
import type { Perfil } from '../../types'

type VistaFormulario = 'ninguno' | 'crear' | 'editar'

export default function Configuracion() {
  const { perfilActivoId, setPerfilActivoId } = useApp()
  const perfiles = useListaPerfiles()
  const config = useConfiguracion(perfilActivoId)
  const [horasInput, setHorasInput] = useState('')
  const [diasInput, setDiasInput] = useState('')
  const [guardandoConfig, setGuardandoConfig] = useState(false)

  const [vistaFormulario, setVistaFormulario] = useState<VistaFormulario>('ninguno')
  const [perfilEditando, setPerfilEditando] = useState<Perfil | null>(null)

  // Modal de eliminación
  const [modalEliminar, setModalEliminar] = useState<{ abierto: boolean; perfil: Perfil | null; cargando: boolean }>({
    abierto: false, perfil: null, cargando: false,
  })

  // Estado de operaciones
  const [mensajeExito, setMensajeExito] = useState('')
  const [mensajeError, setMensajeError] = useState('')
  const [cargandoOp, setCargandoOp] = useState<Record<string, boolean>>({})

  const inputImportRef = useRef<HTMLInputElement>(null)
  const [arrastrando, setArrastrando] = useState(false)

  const mostrarExito = (msg: string) => {
    setMensajeExito(msg)
    setMensajeError('')
    setTimeout(() => setMensajeExito(''), 3500)
  }

  const mostrarError = (msg: string) => {
    setMensajeError(msg)
    setMensajeExito('')
    setTimeout(() => setMensajeError(''), 5000)
  }

  const setCargando = (id: string, val: boolean) =>
    setCargandoOp(prev => ({ ...prev, [id]: val }))

  // Crear perfil
  const handleCrear = async (nombre: string, descripcion: string) => {
    const id = await crearPerfil(nombre, descripcion)
    setPerfilActivoId(id)
    setVistaFormulario('ninguno')
    mostrarExito(`Perfil "${nombre}" creado y seleccionado como activo.`)
  }

  // Duplicar perfil
  const handleDuplicar = async (perfil: Perfil) => {
    setCargando(`dup_${perfil.id}`, true)
    try {
      await duplicarPerfil(perfil.id)
      mostrarExito(`Perfil "${perfil.nombre}" duplicado correctamente.`)
    } catch {
      mostrarError('Error al duplicar el perfil.')
    } finally {
      setCargando(`dup_${perfil.id}`, false)
    }
  }

  // Exportar perfil
  const handleExportar = async (perfil: Perfil) => {
    setCargando(`exp_${perfil.id}`, true)
    try {
      await exportarPerfil(perfil.id)
      mostrarExito(`Perfil "${perfil.nombre}" exportado.`)
    } catch {
      mostrarError('Error al exportar el perfil.')
    } finally {
      setCargando(`exp_${perfil.id}`, false)
    }
  }

  // Eliminar perfil
  const handleConfirmarEliminar = async () => {
    if (!modalEliminar.perfil) return
    setModalEliminar(m => ({ ...m, cargando: true }))
    try {
      const id = modalEliminar.perfil.id
      await eliminarPerfil(id)
      if (perfilActivoId === id) setPerfilActivoId(null)
      mostrarExito(`Perfil "${modalEliminar.perfil.nombre}" eliminado.`)
    } catch {
      mostrarError('Error al eliminar el perfil.')
    } finally {
      setModalEliminar({ abierto: false, perfil: null, cargando: false })
    }
  }

  // Importar perfil
  const procesarArchivoImport = async (archivo: File) => {
    setCargando('importar', true)
    try {
      const resultado = await importarPerfil(archivo)
      if (resultado.ok) {
        mostrarExito('Perfil importado correctamente.')
      } else {
        mostrarError(resultado.error ?? 'Error al importar el perfil.')
      }
    } finally {
      setCargando('importar', false)
    }
  }

  const handleImportar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    e.target.value = ''
    await procesarArchivoImport(archivo)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setArrastrando(false)
    const archivo = e.dataTransfer.files[0]
    if (!archivo || !archivo.name.endsWith('.plastiflow')) {
      mostrarError('Solo se aceptan archivos .plastiflow')
      return
    }
    await procesarArchivoImport(archivo)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header de página */}
      <div className={cls.pageHeader}>
        <div>
          <h1 className={cls.pageTitle}>Configuración</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Gestión de perfiles de fábrica
          </p>
        </div>
      </div>

      {/* Mensajes globales */}
      {mensajeExito && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {mensajeExito}
        </div>
      )}
      {mensajeError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {mensajeError}
        </div>
      )}

      {/* Sección Perfiles */}
      <section className={`${cls.card} p-6`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Perfiles guardados
            <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
              ({perfiles.length} {perfiles.length === 1 ? 'perfil' : 'perfiles'})
            </span>
          </h2>
          <div className="flex items-center gap-2">
            {/* Importar */}
            <input
              ref={inputImportRef}
              type="file"
              accept=".plastiflow"
              className="hidden"
              onChange={handleImportar}
            />
            <button
              onClick={() => inputImportRef.current?.click()}
              disabled={cargandoOp['importar']}
              className={cls.btnSecondary}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {cargandoOp['importar'] ? 'Importando...' : 'Importar'}
            </button>

            {/* Nuevo Perfil */}
            <button
              onClick={() => { setVistaFormulario('crear'); setPerfilEditando(null) }}
              className={cls.btnPrimary}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo perfil
            </button>
          </div>
        </div>

        {/* Formulario de creación */}
        {vistaFormulario === 'crear' && (
          <div className="mb-5 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Nuevo perfil</h3>
            <FormularioPerfil
              onGuardar={handleCrear}
              onCancelar={() => setVistaFormulario('ninguno')}
              labelGuardar="Crear perfil"
            />
          </div>
        )}

        {/* Lista de perfiles */}
        {perfiles.length === 0 && vistaFormulario !== 'crear' ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🏭</div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No hay perfiles guardados</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Crea tu primer perfil para comenzar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {perfiles.map(perfil => {
              const esActivo = perfil.id === perfilActivoId
              return (
                <div
                  key={perfil.id}
                  className={`
                    flex items-start gap-4 p-4 rounded-lg border transition-colors
                    ${esActivo
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-white dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  {/* Indicador activo */}
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${esActivo ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`} />

                  {/* Info del perfil */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {perfil.nombre}
                      </span>
                      {esActivo && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          Activo
                        </span>
                      )}
                      {perfil.esRespaldo && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                          Respaldo
                        </span>
                      )}
                    </div>
                    {perfil.descripcion && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{perfil.descripcion}</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Creado: {formatearFecha(perfil.fechaCreacion)} · Modificado: {formatearFecha(perfil.ultimaModificacion)}
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Seleccionar como activo */}
                    {!esActivo && (
                      <button
                        onClick={() => setPerfilActivoId(perfil.id)}
                        className={cls.btnGhost}
                        title="Usar como perfil activo"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="hidden sm:inline">Activar</span>
                      </button>
                    )}

                    {/* Exportar */}
                    <button
                      onClick={() => handleExportar(perfil)}
                      disabled={cargandoOp[`exp_${perfil.id}`]}
                      className={cls.btnGhost}
                      title="Exportar como .plastiflow"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>

                    {/* Duplicar */}
                    <button
                      onClick={() => handleDuplicar(perfil)}
                      disabled={cargandoOp[`dup_${perfil.id}`]}
                      className={cls.btnGhost}
                      title="Duplicar perfil"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() => setModalEliminar({ abierto: true, perfil, cargando: false })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm rounded-lg transition-colors"
                      title="Eliminar perfil"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Drop zone para importar */}
        <div
          onDragOver={e => { e.preventDefault(); setArrastrando(true) }}
          onDragEnter={e => { e.preventDefault(); setArrastrando(true) }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={handleDrop}
          className={`mt-5 flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-lg border-2 border-dashed transition-colors ${
            arrastrando
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          <svg className={`w-8 h-8 ${arrastrando ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <p className={`text-sm ${arrastrando ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
            {arrastrando ? 'Suelta el archivo aquí' : 'Arrastra un archivo .plastiflow aquí para importarlo'}
          </p>
        </div>
      </section>

      {/* Sección: Ajustes de producción */}
      {perfilActivoId && (
        <section className={`${cls.card} p-6`}>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">
            Ajustes de producción
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={cls.label}>Horas laborales por día</label>
              <input
                type="number"
                min="1"
                max="24"
                step="0.5"
                className={cls.input}
                value={horasInput !== '' ? horasInput : config.horasLaboralesDia}
                onChange={e => setHorasInput(e.target.value)}
                onBlur={async () => {
                  const val = parseFloat(horasInput)
                  if (!isNaN(val) && val > 0 && val <= 24) {
                    setGuardandoConfig(true)
                    await actualizarConfiguracion(perfilActivoId, { horasLaboralesDia: val })
                    setGuardandoConfig(false)
                  }
                  setHorasInput('')
                }}
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Usado para calcular piezas/día en los moldes. Actual: {config.horasLaboralesDia} hrs
              </p>
            </div>
            <div>
              <label className={cls.label}>Días hábiles por mes</label>
              <input
                type="number"
                min="1"
                max="31"
                step="1"
                className={cls.input}
                value={diasInput !== '' ? diasInput : config.diasHabilMes}
                onChange={e => setDiasInput(e.target.value)}
                onBlur={async () => {
                  const val = parseInt(diasInput)
                  if (!isNaN(val) && val > 0 && val <= 31) {
                    setGuardandoConfig(true)
                    await actualizarConfiguracion(perfilActivoId, { diasHabilMes: val })
                    setGuardandoConfig(false)
                  }
                  setDiasInput('')
                }}
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Usado para calcular piezas/mes en los moldes. Actual: {config.diasHabilMes} días
              </p>
            </div>
          </div>
          {guardandoConfig && <p className="text-xs text-blue-500 mt-3">Guardando...</p>}
        </section>
      )}

      {/* Sección Futuro: Nube */}
      <section className={`${cls.card} p-6 opacity-60`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Conectar a la nube</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">Disponible en la próxima versión — sincronización con Supabase</p>
          </div>
          <span className="ml-auto text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full">
            Próximamente
          </span>
        </div>
      </section>

      {/* Modal de confirmación de eliminación */}
      <Modal
        abierto={modalEliminar.abierto}
        titulo="Eliminar perfil"
        mensaje={
          <div className="space-y-2">
            <p>
              ¿Estás seguro de que quieres eliminar el perfil{' '}
              <strong className="text-gray-900 dark:text-white">{modalEliminar.perfil?.nombre}</strong>?
            </p>
            <p className="text-red-600 dark:text-red-400 text-xs font-medium">
              Esta acción eliminará también todas las máquinas, moldes, clientes, materiales y órdenes asociadas. No se puede deshacer.
            </p>
          </div>
        }
        labelConfirmar="Eliminar perfil"
        variante="danger"
        cargando={modalEliminar.cargando}
        onConfirmar={handleConfirmarEliminar}
        onCancelar={() => setModalEliminar({ abierto: false, perfil: null, cargando: false })}
      />
    </div>
  )
}
