// ============================================================
// PlastiFlow — Dashboard
// ============================================================

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useApp } from '../../context/AppContext'
import { db } from '../../db/database'
import {
  cls,
  chipTipoAlerta,
  labelTipoAlerta,
  iconoTipoAlerta,
} from '../../utils/ui'
import SinPerfilActivo from '../../components/ui/SinPerfilActivo'
import type {
  OrdenProduccion,
  Maquina,
  Molde,
  Material,
  Cliente,
  Alerta,
} from '../../types'

// ─────────────────────────────────────────────
// Sub-componente: Módulo Card
// ─────────────────────────────────────────────

interface ModuloCardProps {
  icono: string
  nombre: string
  descripcion: string
  ruta: string
}

function ModuloCard({ icono, nombre, descripcion, ruta }: ModuloCardProps) {
  const navigate = useNavigate()
  return (
    <div
      className={`${cls.card} p-5 cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500 transition-all`}
      onClick={() => navigate(ruta)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icono}</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{nombre}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{descripcion}</p>
          </div>
        </div>
        <svg className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export default function Dashboard() {
  const { perfilActivoId } = useApp()
  const navigate = useNavigate()

  // Guard
  if (!perfilActivoId) return <SinPerfilActivo />

  // ── Datos reactivos ────────────────────────
  const ordenes    = useLiveQuery<OrdenProduccion[]>(() => db.ordenes.where('perfilId').equals(perfilActivoId).toArray(), [perfilActivoId]) ?? []
  const maquinas   = useLiveQuery<Maquina[]>(() => db.maquinas.where('perfilId').equals(perfilActivoId).toArray(), [perfilActivoId]) ?? []
  const moldes     = useLiveQuery<Molde[]>(() => db.moldes.where('perfilId').equals(perfilActivoId).toArray(), [perfilActivoId]) ?? []
  const materiales = useLiveQuery<Material[]>(() => db.materiales.where('perfilId').equals(perfilActivoId).toArray(), [perfilActivoId]) ?? []
  const clientes   = useLiveQuery<Cliente[]>(() => db.clientes.where('perfilId').equals(perfilActivoId).toArray(), [perfilActivoId]) ?? []
  const alertas    = useLiveQuery<Alerta[]>(() => db.alertas.where('perfilId').equals(perfilActivoId).toArray(), [perfilActivoId]) ?? []

  // ── Alertas recientes ─────────────────────
  const alertasRecientes = useMemo(() =>
    [...alertas]
      .sort((a, b) => b.fechaGeneracion.localeCompare(a.fechaGeneracion))
      .slice(0, 5)
  , [alertas])

  // ── Render ────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* Título */}
      <div>
        <h1 className={cls.pageTitle}>Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Vista general del perfil activo
        </p>
      </div>

      {/* ── Sección 1: Módulos ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Módulos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ModuloCard
            icono="📋"
            nombre="Órdenes de Producción"
            descripcion={`${ordenes.length} orden${ordenes.length !== 1 ? 'es' : ''} registrada${ordenes.length !== 1 ? 's' : ''}`}
            ruta="/ordenes"
          />
          <ModuloCard
            icono="⚙️"
            nombre="Máquinas"
            descripcion={`${maquinas.length} máquina${maquinas.length !== 1 ? 's' : ''} registrada${maquinas.length !== 1 ? 's' : ''}`}
            ruta="/maquinas"
          />
          <ModuloCard
            icono="🔩"
            nombre="Moldes"
            descripcion={`${moldes.length} molde${moldes.length !== 1 ? 's' : ''} registrado${moldes.length !== 1 ? 's' : ''}`}
            ruta="/moldes"
          />
          <ModuloCard
            icono="🧪"
            nombre="Materiales"
            descripcion={`${materiales.length} material${materiales.length !== 1 ? 'es' : ''} registrado${materiales.length !== 1 ? 's' : ''}`}
            ruta="/materiales"
          />
          <ModuloCard
            icono="👥"
            nombre="Clientes"
            descripcion={`${clientes.length} cliente${clientes.length !== 1 ? 's' : ''} registrado${clientes.length !== 1 ? 's' : ''}`}
            ruta="/clientes"
          />
          <ModuloCard
            icono="📊"
            nombre="Estadísticas"
            descripcion="Ver reportes y análisis"
            ruta="/estadisticas"
          />
        </div>
      </section>

      {/* ── Sección 3: Alertas recientes ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Alertas recientes
          </h2>
          <button
            onClick={() => navigate('/alertas')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Ver todas →
          </button>
        </div>

        <div className={`${cls.card} divide-y divide-gray-100 dark:divide-gray-800`}>
          {alertasRecientes.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-gray-400 dark:text-gray-600">
              <span className="text-3xl">🔔</span>
              <p className="text-sm">Sin alertas activas</p>
            </div>
          ) : (
            alertasRecientes.map(alerta => (
              <div
                key={alerta.id}
                className={`px-4 py-3 flex items-center gap-3 ${alerta.ordenId ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''} transition-colors`}
                onClick={() => {
                  if (alerta.ordenId) navigate(`/ordenes/${alerta.ordenId}`)
                  else navigate('/alertas')
                }}
              >
                <span className={`${chipTipoAlerta(alerta.tipo)} shrink-0`}>
                  {iconoTipoAlerta(alerta.tipo)} {labelTipoAlerta(alerta.tipo)}
                </span>

                <p className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 min-w-0">
                  {alerta.mensaje}
                </p>

                <div className="flex items-center gap-2 shrink-0">
                  {alerta.folio && (
                    <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {alerta.folio}
                    </span>
                  )}
                  {!alerta.vista && (
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

    </div>
  )
}
