// ============================================================
// PlastiFlow — Componente: Modal de Confirmación
// ============================================================

import { useEffect, type ReactNode } from 'react'
import { cls } from '../../utils/ui'

interface ModalProps {
  abierto: boolean
  titulo: string
  mensaje: ReactNode
  labelConfirmar?: string
  variante?: 'danger' | 'primary'
  cargando?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export default function Modal({
  abierto,
  titulo,
  mensaje,
  labelConfirmar = 'Confirmar',
  variante = 'danger',
  cargando = false,
  onConfirmar,
  onCancelar,
}: ModalProps) {
  // Cerrar con Escape
  useEffect(() => {
    if (!abierto) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancelar()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [abierto, onCancelar])

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancelar}
      />

      {/* Panel */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{titulo}</h2>
          <button
            onClick={onCancelar}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
          {mensaje}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onCancelar} className={cls.btnSecondary} disabled={cargando}>
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={cargando}
            className={variante === 'danger' ? cls.btnDanger : cls.btnPrimary}
          >
            {cargando ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Procesando...
              </span>
            ) : labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
