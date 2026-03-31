import { useState, useRef, useEffect } from 'react'
import { cambiarEstadoOrden } from '../../hooks/useOrdenes'
import { chipEstadoOrden, labelEstadoOrden } from '../../utils/ui'
import type { EstadoOrden } from '../../types'

const ESTADOS: EstadoOrden[] = ['pendiente', 'en_produccion', 'listo', 'entregado', 'con_riesgo']

interface Props {
  ordenId: string
  estado: EstadoOrden
}

export default function SelectorEstadoOrden({ ordenId, estado }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [cambiando, setCambiando] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [abierto])

  const handleCambiar = async (nuevoEstado: EstadoOrden) => {
    if (nuevoEstado === estado) { setAbierto(false); return }
    setCambiando(true)
    await cambiarEstadoOrden(ordenId, nuevoEstado)
    setCambiando(false)
    setAbierto(false)
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setAbierto(v => !v)}
        disabled={cambiando}
        className={`${chipEstadoOrden(estado)} cursor-pointer gap-1 pr-1.5`}
      >
        {labelEstadoOrden(estado)}
        <svg className={`w-3 h-3 transition-transform ${abierto ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {abierto && (
        <div className="absolute z-20 top-full left-0 mt-1 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {ESTADOS.map(e => (
            <button
              key={e}
              onClick={() => handleCambiar(e)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors
                ${e === estado
                  ? 'bg-gray-50 dark:bg-gray-800'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
              <span className={chipEstadoOrden(e)}>{labelEstadoOrden(e)}</span>
              {e === estado && (
                <svg className="w-3 h-3 text-blue-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
