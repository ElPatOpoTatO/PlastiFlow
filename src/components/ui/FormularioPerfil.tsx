// ============================================================
// PlastiFlow — Componente: Formulario Crear/Editar Perfil
// ============================================================

import { useState } from 'react'
import { cls } from '../../utils/ui'

interface FormularioPerfilProps {
  valorInicial?: { nombre: string; descripcion: string }
  onGuardar: (nombre: string, descripcion: string) => Promise<void>
  onCancelar: () => void
  labelGuardar?: string
}

export default function FormularioPerfil({
  valorInicial = { nombre: '', descripcion: '' },
  onGuardar,
  onCancelar,
  labelGuardar = 'Crear perfil',
}: FormularioPerfilProps) {
  const [nombre, setNombre] = useState(valorInicial.nombre)
  const [descripcion, setDescripcion] = useState(valorInicial.descripcion)
  const [errorNombre, setErrorNombre] = useState('')
  const [cargando, setCargando] = useState(false)

  const validarNombre = (valor: string): string => {
    if (!valor.trim()) return 'El nombre es requerido'
    if (valor.trim().length < 2) return 'Mínimo 2 caracteres'
    if (valor.trim().length > 80) return 'Máximo 80 caracteres'
    return ''
  }

  const handleNombre = (valor: string) => {
    setNombre(valor)
    setErrorNombre(validarNombre(valor))
  }

  const handleGuardar = async () => {
    const err = validarNombre(nombre)
    if (err) { setErrorNombre(err); return }

    setCargando(true)
    try {
      await onGuardar(nombre.trim(), descripcion.trim())
    } finally {
      setCargando(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) handleGuardar()
    if (e.key === 'Escape') onCancelar()
  }

  return (
    <div className="space-y-4">
      {/* Nombre */}
      <div>
        <label className={cls.label}>
          Nombre del perfil <span className="text-red-500">*</span>
        </label>
        <input
          className={`${cls.input} ${errorNombre ? 'border-red-500 focus:ring-red-500' : ''}`}
          placeholder="Ej. Fábrica Norte S.A."
          value={nombre}
          onChange={e => handleNombre(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          maxLength={80}
        />
        {errorNombre && <p className={cls.errorText}>{errorNombre}</p>}
      </div>

      {/* Descripción */}
      <div>
        <label className={cls.label}>Descripción</label>
        <textarea
          className={`${cls.input} resize-none`}
          placeholder="Descripción opcional del perfil"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          rows={2}
          maxLength={200}
        />
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <button onClick={onCancelar} className={cls.btnSecondary} disabled={cargando}>
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          disabled={cargando || !!errorNombre}
          className={cls.btnPrimary}
        >
          {cargando ? 'Guardando...' : labelGuardar}
        </button>
      </div>
    </div>
  )
}
