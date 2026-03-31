import { type ReactNode } from 'react'

interface EmptyStateProps {
  icono?: string
  titulo: string
  descripcion?: string
  accion?: ReactNode
}

export default function EmptyState({ icono = '📭', titulo, descripcion, accion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-5xl mb-4">{icono}</div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{titulo}</p>
      {descripcion && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">{descripcion}</p>
      )}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  )
}
