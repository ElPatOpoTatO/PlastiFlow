import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCliente, crearCliente, actualizarCliente } from '../../hooks/useClientes'
import { useApp } from '../../context/AppContext'
import { cls } from '../../utils/ui'

interface Props { id?: string; onGuardado?: () => void; onCancelado?: () => void }
type Form = { nombre: string; identificador: string; notas: string }
type Errores = Partial<Record<keyof Form, string>>

function validar(_f: Form): Errores {
  return {}
}

export default function ClientesFormulario({ id, onGuardado, onCancelado }: Props) {
  const { perfilActivoId } = useApp()
  const navigate = useNavigate()
  const clienteExistente = useCliente(id)
  const [form, setForm] = useState<Form>({ nombre: '', identificador: '', notas: '' })
  const [errores, setErrores] = useState<Errores>({})
  const [tocados, setTocados] = useState<Set<keyof Form>>(new Set())
  const [guardando, setGuardando] = useState(false)
  const esEdicion = !!id

  useEffect(() => {
    if (clienteExistente) {
      setForm({ nombre: clienteExistente.nombre, identificador: clienteExistente.identificador, notas: clienteExistente.notas })
    }
  }, [clienteExistente])

  const handleChange = (campo: keyof Form, valor: string) => {
    const nuevoForm = { ...form, [campo]: valor }
    setForm(nuevoForm)
    setTocados(t => new Set(t).add(campo))
    setErrores(prev => ({ ...prev, [campo]: validar(nuevoForm)[campo] }))
  }

  const handleGuardar = async () => {
    const todosErrores = validar(form)
    setErrores(todosErrores)
    setTocados(new Set(Object.keys(form) as (keyof Form)[]))
    if (Object.keys(todosErrores).length > 0) return
    setGuardando(true)
    try {
      const datos = { nombre: form.nombre.trim(), identificador: form.identificador.trim(), notas: form.notas.trim(), perfilId: perfilActivoId! }
      if (esEdicion) await actualizarCliente(id!, datos)
      else await crearCliente(datos)
      if (onGuardado) onGuardado()
      else navigate('/clientes')
    } finally { setGuardando(false) }
  }

  const handleCancelar = () => {
    if (onCancelado) onCancelado()
    else navigate(esEdicion ? `/clientes/${id}` : '/clientes')
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handleCancelar} className={cls.btnGhost}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className={cls.pageTitle}>{esEdicion ? 'Editar cliente' : 'Nuevo cliente'}</h1>
      </div>

      <div className={`${cls.card} p-6 space-y-5`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={cls.label}>Nombre / Empresa</label>
            <input
              placeholder="Ej. Envases del Norte S.A."
              value={form.nombre}
              onChange={e => handleChange('nombre', e.target.value)}
              className={`${cls.input} ${tocados.has('nombre') && errores.nombre ? 'border-red-400 focus:ring-red-400' : ''}`}
            />
            {tocados.has('nombre') && errores.nombre && <p className={cls.errorText}>{errores.nombre}</p>}
          </div>
          <div>
            <label className={cls.label}>Identificador</label>
            <input placeholder="Ej. CLI-001"
              value={form.identificador} onChange={e => handleChange('identificador', e.target.value)} className={cls.input} />
          </div>
        </div>
        <div>
          <label className={cls.label}>Notas</label>
          <textarea rows={4} placeholder="Información de contacto, observaciones relevantes..."
            value={form.notas} onChange={e => handleChange('notas', e.target.value)} className={`${cls.input} resize-none`} />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button onClick={handleCancelar} className={cls.btnSecondary} disabled={guardando}>Cancelar</button>
          <button onClick={handleGuardar} disabled={guardando} className={cls.btnPrimary}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}
