// ============================================================
// PlastiFlow — Contexto Global de la Aplicación
// ============================================================

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AppState } from '../types'

interface AppContextValue extends AppState {
  setPerfilActivoId: (id: string | null) => void
  toggleTema: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

const STORAGE_KEY_PERFIL = 'plastiflow_perfil_activo'
const STORAGE_KEY_TEMA = 'plastiflow_tema'

export function AppProvider({ children }: { children: ReactNode }) {
  const [perfilActivoId, setPerfilActivoIdState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_PERFIL)
  })

  const [tema, setTema] = useState<'claro' | 'oscuro'>(() => {
    const guardado = localStorage.getItem(STORAGE_KEY_TEMA)
    if (guardado === 'oscuro' || guardado === 'claro') return guardado
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro'
  })

  // Aplicar clase dark al <html> para Tailwind darkMode: 'class'
  useEffect(() => {
    const root = document.documentElement
    if (tema === 'oscuro') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem(STORAGE_KEY_TEMA, tema)
  }, [tema])

  const setPerfilActivoId = (id: string | null) => {
    setPerfilActivoIdState(id)
    if (id) {
      localStorage.setItem(STORAGE_KEY_PERFIL, id)
    } else {
      localStorage.removeItem(STORAGE_KEY_PERFIL)
    }
  }

  const toggleTema = () => {
    setTema(t => (t === 'claro' ? 'oscuro' : 'claro'))
  }

  return (
    <AppContext.Provider value={{ perfilActivoId, tema, setPerfilActivoId, toggleTema }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider')
  return ctx
}
