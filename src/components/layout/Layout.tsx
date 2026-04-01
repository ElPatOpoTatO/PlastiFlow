// ============================================================
// PlastiFlow — Layout Principal (Header + Sidebar + Contenido)
// ============================================================

import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import { useApp } from '../../context/AppContext'
import { db } from '../../db/database'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Perfil, Alerta } from '../../types'

const STORAGE_KEY_SIDEBAR = 'plastiflow_sidebar_collapsed'

export default function Layout() {
  const { perfilActivoId } = useApp()

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_SIDEBAR) === 'true'
  })

  const perfilActivo = useLiveQuery<Perfil | undefined>(
    () => perfilActivoId ? db.perfiles.get(perfilActivoId) : Promise.resolve(undefined),
    [perfilActivoId]
  )

  const totalAlertas = useLiveQuery(
    async () => {
      if (!perfilActivoId) return 0
      return db.alertas
        .where('perfilId').equals(perfilActivoId)
        .filter((a: Alerta) => !a.vista)
        .count()
    },
    [perfilActivoId]
  ) ?? 0

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY_SIDEBAR, String(next))
      return next
    })
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Área derecha: header + contenido */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
          nombrePerfil={perfilActivo?.nombre ?? ''}
          totalAlertas={totalAlertas}
        />

        {/* Contenido de la página activa */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
