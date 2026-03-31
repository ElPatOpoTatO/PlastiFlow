// ============================================================
// PlastiFlow — Sidebar de navegación
// ============================================================

import { NavLink } from 'react-router-dom'

interface NavItem {
  path: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { path: '/',              label: 'Dashboard',             icon: '⊞' },
  { path: '/ordenes',       label: 'Órdenes',               icon: '📋' },
  { path: '/maquinas',      label: 'Máquinas',              icon: '⚙️' },
  { path: '/moldes',        label: 'Moldes',                icon: '🔷' },
  { path: '/materiales',    label: 'Materiales',            icon: '📦' },
  { path: '/clientes',      label: 'Clientes',              icon: '👥' },
  { path: '/estadisticas',  label: 'Estadísticas',          icon: '📊' },
  { path: '/calendario',    label: 'Calendario',            icon: '📅' },
  { path: '/configuracion', label: 'Configuración',         icon: '⚙' },
]

interface SidebarProps {
  collapsed: boolean
}

export default function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside
      className={`
        flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 h-full
        ${collapsed ? 'w-16' : 'w-56'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
        {collapsed ? (
          <span className="text-blue-600 font-black text-xl mx-auto">P</span>
        ) : (
          <span className="text-blue-600 font-black text-lg tracking-tight">PlastiFlow</span>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              isActive
                ? `flex items-center gap-3 px-4 py-2.5 mx-2 mb-0.5 text-sm font-black border-l-4 border-black dark:border-white bg-black dark:bg-white text-white dark:text-gray-900`
                : `flex items-center gap-3 px-4 py-2.5 mx-2 mb-0.5 text-sm font-bold text-gray-600 dark:text-gray-400 border-l-4 border-transparent hover:border-black dark:hover:border-white hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100`
            }
          >
            <span className="text-base shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
