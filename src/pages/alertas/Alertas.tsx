// ============================================================
// PlastiFlow — Página de Alertas
// ============================================================

import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import {
  useAlertas,
  generarAlertas,
  marcarVistaAlerta,
  marcarTodasVistas,
  eliminarAlerta,
  eliminarTodasAlertas,
} from '../../hooks/useAlertas'
import {
  cls,
  chipPrioridad,
  labelPrioridad,
  chipTipoAlerta,
  labelTipoAlerta,
  iconoTipoAlerta,
} from '../../utils/ui'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import SinPerfilActivo from '../../components/ui/SinPerfilActivo'
import type { TipoAlerta, PrioridadOrden } from '../../types'

// ─────────────────────────────────────────────
// Tipos y constantes
// ─────────────────────────────────────────────

type FiltroTipo = 'todas' | 'no_leidas' | TipoAlerta

interface ChipDef {
  valor: FiltroTipo
  label: string
}

const CHIPS: ChipDef[] = [
  { valor: 'todas',               label: 'Todas' },
  { valor: 'no_leidas',           label: 'No leídas' },
  { valor: 'entrega_proxima',     label: 'Entrega próxima' },
  { valor: 'proyeccion_ajustada', label: 'Proyección' },
  { valor: 'inventario_bajo',     label: 'Inventario' },
]

// ─────────────────────────────────────────────
// Helper: tiempo relativo
// ─────────────────────────────────────────────

function tiempoRelativo(isoFecha: string): string {
  const diffMs = Date.now() - new Date(isoFecha).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Hace un momento'
  if (mins < 60) return `Hace ${mins} min`
  const horas = Math.floor(mins / 60)
  if (horas < 24) return `Hace ${horas}h`
  const dias = Math.floor(horas / 24)
  return `Hace ${dias} día${dias !== 1 ? 's' : ''}`
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export default function Alertas() {
  const { perfilActivoId } = useApp()
  const navigate = useNavigate()

  const [filtroActivo, setFiltroActivo] = useState<FiltroTipo>('todas')
  const [generando, setGenerando] = useState(false)
  const [modalEliminarTodas, setModalEliminarTodas] = useState(false)
  const [eliminandoTodas, setEliminandoTodas] = useState(false)

  // Guardia: sin perfil activo
  if (!perfilActivoId) return <SinPerfilActivo />

  // ── Datos ──────────────────────────────────
  const todasLasAlertas = useAlertas(perfilActivoId)

  // Conteos por chip
  const conteos = useMemo(() => ({
    todas:               todasLasAlertas.length,
    no_leidas:           todasLasAlertas.filter(a => !a.vista).length,
    entrega_proxima:     todasLasAlertas.filter(a => a.tipo === 'entrega_proxima').length,
    proyeccion_ajustada: todasLasAlertas.filter(a => a.tipo === 'proyeccion_ajustada').length,
    inventario_bajo:     todasLasAlertas.filter(a => a.tipo === 'inventario_bajo').length,
  }), [todasLasAlertas])

  // Alertas filtradas según chip activo
  const alertasFiltradas = useMemo(() => {
    if (filtroActivo === 'todas') return todasLasAlertas
    if (filtroActivo === 'no_leidas') return todasLasAlertas.filter(a => !a.vista)
    return todasLasAlertas.filter(a => a.tipo === filtroActivo)
  }, [todasLasAlertas, filtroActivo])

  // ── Generar alertas al montar ──────────────
  useEffect(() => {
    if (!perfilActivoId) return
    setGenerando(true)
    generarAlertas(perfilActivoId).finally(() => setGenerando(false))
  }, [perfilActivoId])

  // ── Handlers ──────────────────────────────
  const handleActualizar = async () => {
    setGenerando(true)
    try { await generarAlertas(perfilActivoId) } finally { setGenerando(false) }
  }

  const handleMarcarTodasLeidas = async () => {
    await marcarTodasVistas(perfilActivoId)
  }

  const handleEliminarTodas = async () => {
    setEliminandoTodas(true)
    try {
      await eliminarTodasAlertas(perfilActivoId)
      setModalEliminarTodas(false)
    } finally {
      setEliminandoTodas(false)
    }
  }

  const handleClickTarjeta = async (alertaId: string, ordenId?: string) => {
    await marcarVistaAlerta(alertaId)
    if (ordenId) navigate(`/ordenes/${ordenId}`)
  }

  // ── Render ────────────────────────────────
  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className={cls.pageHeader}>
        <div>
          <h1 className={cls.pageTitle}>Alertas</h1>
          {conteos.no_leidas > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {conteos.no_leidas} alerta{conteos.no_leidas !== 1 ? 's' : ''} sin leer
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Botón Actualizar */}
          <button
            onClick={handleActualizar}
            disabled={generando}
            className={cls.btnSecondary}
            title="Regenerar alertas"
          >
            {generando ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Actualizar
          </button>

          {/* Marcar todas leídas */}
          <button
            onClick={handleMarcarTodasLeidas}
            disabled={conteos.no_leidas === 0}
            className={cls.btnSecondary}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Marcar leídas
          </button>

          {/* Eliminar todas */}
          <button
            onClick={() => setModalEliminarTodas(true)}
            disabled={conteos.todas === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium rounded-lg border border-red-200 dark:border-red-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar todas
          </button>
        </div>
      </div>

      {/* Chips de filtro */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CHIPS.map(chip => {
          const count = conteos[chip.valor as keyof typeof conteos]
          const activo = filtroActivo === chip.valor
          return (
            <button
              key={chip.valor}
              onClick={() => setFiltroActivo(chip.valor)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${activo
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }
              `}
            >
              {chip.label}
              <span className={`
                min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1
                ${activo
                  ? 'bg-white/25 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }
              `}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Lista de alertas */}
      {alertasFiltradas.length === 0 ? (
        todasLasAlertas.length === 0 ? (
          <EmptyState
            icono="🔔"
            titulo="Sin alertas activas"
            descripcion="Todo está en orden. Las alertas aparecerán aquí cuando se detecten condiciones de atención."
          />
        ) : (
          <EmptyState
            icono="🔍"
            titulo="Sin resultados en este filtro"
            descripcion="Prueba seleccionando otro filtro."
          />
        )
      ) : (
        <div className="space-y-3">
          {alertasFiltradas.map(alerta => (
            <div
              key={alerta.id}
              className={`
                ${cls.card} p-4 transition-all
                ${alerta.ordenId ? 'cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600' : ''}
                ${!alerta.vista
                  ? 'bg-blue-50/60 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                  : ''
                }
              `}
              onClick={() => handleClickTarjeta(alerta.id, alerta.ordenId)}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Chips + punto no leída */}
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className={chipTipoAlerta(alerta.tipo)}>
                    {iconoTipoAlerta(alerta.tipo)} {labelTipoAlerta(alerta.tipo)}
                  </span>
                  <span className={chipPrioridad(alerta.prioridad as PrioridadOrden)}>
                    {labelPrioridad(alerta.prioridad as PrioridadOrden)}
                  </span>
                  {!alerta.vista && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  )}
                </div>

                {/* Botones de acción */}
                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={e => e.stopPropagation()}
                >
                  {!alerta.vista && (
                    <button
                      onClick={() => marcarVistaAlerta(alerta.id)}
                      className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                      title="Marcar como leída"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => eliminarAlerta(alerta.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Eliminar alerta"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Mensaje */}
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {alerta.mensaje}
              </p>

              {/* Footer: folio + tiempo */}
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                {alerta.folio && (
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {alerta.folio}
                  </span>
                )}
                <span>{tiempoRelativo(alerta.fechaGeneracion)}</span>
                {alerta.ordenId && (
                  <span className="text-gray-300 dark:text-gray-600">· Click para ver orden</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal confirmar eliminar todas */}
      <Modal
        abierto={modalEliminarTodas}
        titulo="Eliminar todas las alertas"
        mensaje={
          <p>
            Se eliminarán las <strong>{conteos.todas}</strong> alerta{conteos.todas !== 1 ? 's' : ''} del perfil.
            Esta acción no se puede deshacer.
          </p>
        }
        labelConfirmar="Eliminar todas"
        variante="danger"
        cargando={eliminandoTodas}
        onConfirmar={handleEliminarTodas}
        onCancelar={() => setModalEliminarTodas(false)}
      />
    </div>
  )
}
