// ============================================================
// PlastiFlow — Header principal con selector de perfil activo
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useListaPerfiles } from '../../hooks/usePerfiles'

interface HeaderProps {
  onToggleSidebar: () => void
  sidebarCollapsed: boolean
  nombrePerfil: string
  totalAlertas: number
}

export default function Header({
  onToggleSidebar,
  nombrePerfil,
  totalAlertas,
}: HeaderProps) {
  const { tema, toggleTema, perfilActivoId, setPerfilActivoId } = useApp()
  const perfiles = useListaPerfiles()
  const navigate = useNavigate()

  const [dropdownAbierto, setDropdownAbierto] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })

  const actualizarPosicion = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, left: rect.left })
    }
  }, [])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    if (!dropdownAbierto) return
    actualizarPosicion()
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setDropdownAbierto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownAbierto, actualizarPosicion])

  const handleSeleccionarPerfil = (id: string) => {
    setPerfilActivoId(id)
    setDropdownAbierto(false)
  }

  const handleAdministrar = () => {
    setDropdownAbierto(false)
    navigate('/configuracion')
  }

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4 shrink-0 z-10">
      {/* Toggle sidebar */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        aria-label="Toggle menú"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Selector de perfil activo */}
      <div className="relative flex-1 min-w-0">
        <button
          ref={triggerRef}
          onClick={() => setDropdownAbierto(prev => !prev)}
          className="flex items-center gap-2 max-w-xs px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
        >
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden sm:block shrink-0">
            Perfil:
          </span>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
            {nombrePerfil || 'Sin perfil activo'}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 transition-transform ${dropdownAbierto ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown (portal) */}
        {dropdownAbierto && createPortal(
          <div
            ref={dropdownRef}
            className="fixed w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-[9999] overflow-hidden"
            style={{ top: dropdownPos.top, left: dropdownPos.left }}
          >
            {/* Lista de perfiles */}
            <div className="py-1 max-h-64 overflow-y-auto">
              {perfiles.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 text-center">
                  No hay perfiles guardados
                </div>
              ) : (
                perfiles.map(perfil => {
                  const esActivo = perfil.id === perfilActivoId
                  return (
                    <button
                      key={perfil.id}
                      onClick={() => handleSeleccionarPerfil(perfil.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                        ${esActivo
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }
                      `}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${esActivo ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{perfil.nombre}</p>
                        {perfil.descripcion && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{perfil.descripcion}</p>
                        )}
                      </div>
                      {esActivo && (
                        <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )
                })
              )}
            </div>

            {/* Administrar perfiles */}
            <div className="border-t border-gray-200 dark:border-gray-700 py-1">
              <button
                onClick={handleAdministrar}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Administrar perfiles
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Acciones del header */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Ícono de alertas */}
        <Link
          to="/alertas"
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          aria-label="Ver alertas"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {totalAlertas > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-0.5">
              {totalAlertas > 99 ? '99+' : totalAlertas}
            </span>
          )}
        </Link>

        {/* Toggle modo oscuro/claro */}
        <button
          onClick={toggleTema}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          aria-label={tema === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {tema === 'oscuro' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}
