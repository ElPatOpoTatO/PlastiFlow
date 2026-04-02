import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMaterial, crearMaterial, actualizarMaterial } from '../../hooks/useMateriales'
import { useApp } from '../../context/AppContext'
import { cls } from '../../utils/ui'

interface Props {
  id?: string
  onGuardado?: () => void
  onCancelado?: () => void
}

type Form = {
  nombre: string
  identificador: string
  mermaEstandar: string
  inventarioActual: string
  puntoReorden: string
  notas: string
}

type Errores = Partial<Record<keyof Form, string>>

const FORM_VACIO: Form = {
  nombre: '', identificador: '', mermaEstandar: '', inventarioActual: '', puntoReorden: '', notas: '',
}

function validar(f: Form): Errores {
  const e: Errores = {}
  if (!f.nombre.trim()) e.nombre = 'El nombre es requerido'
  const merma = parseFloat(f.mermaEstandar)
  if (f.mermaEstandar === '' || isNaN(merma)) e.mermaEstandar = 'Requerido'
  else if (merma < 0 || merma > 100) e.mermaEstandar = 'Debe ser entre 0 y 100'
  const inv = parseFloat(f.inventarioActual)
  if (f.inventarioActual === '' || isNaN(inv)) e.inventarioActual = 'Requerido'
  else if (inv < 0) e.inventarioActual = 'No puede ser negativo'
  const pr = parseFloat(f.puntoReorden)
  if (f.puntoReorden === '' || isNaN(pr)) e.puntoReorden = 'Requerido'
  else if (pr < 0) e.puntoReorden = 'No puede ser negativo'
  return e
}

export default function MaterialesFormulario({ id, onGuardado, onCancelado }: Props) {
  const { perfilActivoId } = useApp()
  const navigate = useNavigate()
  const materialExistente = useMaterial(id)

  const [form, setForm] = useState<Form>(FORM_VACIO)
  const [errores, setErrores] = useState<Errores>({})
  const [guardando, setGuardando] = useState(false)
  const [tocados, setTocados] = useState<Set<keyof Form>>(new Set())

  const esEdicion = !!id

  // Pre-cargar datos en modo edición
  useEffect(() => {
    if (materialExistente) {
      setForm({
        nombre: materialExistente.nombre,
        identificador: materialExistente.identificador,
        mermaEstandar: String(materialExistente.mermaEstandar),
        inventarioActual: String(materialExistente.inventarioActual),
        puntoReorden: String(materialExistente.puntoReorden),
        notas: materialExistente.notas,
      })
    }
  }, [materialExistente])

  const handleChange = (campo: keyof Form, valor: string) => {
    const nuevoForm = { ...form, [campo]: valor }
    setForm(nuevoForm)
    setTocados(t => new Set(t).add(campo))
    const nuevosErrores = validar(nuevoForm)
    setErrores(prev => ({ ...prev, [campo]: nuevosErrores[campo] }))
  }

  const handleGuardar = async () => {
    const todosErrores = validar(form)
    setErrores(todosErrores)
    setTocados(new Set(Object.keys(form) as (keyof Form)[]))
    if (Object.keys(todosErrores).length > 0) return

    setGuardando(true)
    try {
      const datos = {
        nombre: form.nombre.trim(),
        identificador: form.identificador.trim(),
        mermaEstandar: parseFloat(form.mermaEstandar),
        inventarioActual: parseFloat(form.inventarioActual),
        puntoReorden: parseFloat(form.puntoReorden),
        notas: form.notas.trim(),
        perfilId: perfilActivoId!,
      }
      if (esEdicion) {
        await actualizarMaterial(id!, datos)
      } else {
        await crearMaterial(datos)
      }
      if (onGuardado) onGuardado()
      else navigate('/materiales')
    } finally {
      setGuardando(false)
    }
  }

  const handleCancelar = () => {
    if (onCancelado) onCancelado()
    else navigate(esEdicion ? `/materiales/${id}` : '/materiales')
  }

  const campo = (k: keyof Form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleChange(k, e.target.value),
    className: `${cls.input} ${tocados.has(k) && errores[k] ? 'border-red-400 focus:ring-red-400' : ''}`,
  })

  const numBlur = (k: keyof Form, min = 0) => ({
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      if (e.target.value === '' || isNaN(Number(e.target.value))) {
        handleChange(k, String(min))
      }
    },
  })

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handleCancelar} className={cls.btnGhost}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className={cls.pageTitle}>{esEdicion ? 'Editar material' : 'Nuevo material'}</h1>
      </div>

      <div className={`${cls.card} p-6 space-y-5`}>
        {/* Nombre e Identificador */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={cls.label}>Nombre <span className="text-red-500">*</span></label>
            <input placeholder="Ej. PP, HDPE, ABS" {...campo('nombre')} />
            {tocados.has('nombre') && errores.nombre && <p className={cls.errorText}>{errores.nombre}</p>}
          </div>
          <div>
            <label className={cls.label}>Identificador</label>
            <input placeholder="Ej. MAT-01" {...campo('identificador')} />
          </div>
        </div>

        {/* Merma — campo crítico */}
        <div>
          <label className={cls.label}>
            Merma estándar (%) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="Ej. 5"
            {...campo('mermaEstandar')}
            {...numBlur('mermaEstandar')}
          />
          {tocados.has('mermaEstandar') && errores.mermaEstandar
            ? <p className={cls.errorText}>{errores.mermaEstandar}</p>
            : <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Porcentaje de desperdicio típico. Se aplica a todos los cálculos de consumo.
              </p>
          }
        </div>

        {/* Inventario y Punto de reorden */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={cls.label}>Inventario actual (kg) <span className="text-red-500">*</span></label>
            <input type="number" min="0" step="0.1" placeholder="0.0" {...campo('inventarioActual')} {...numBlur('inventarioActual')} />
            {tocados.has('inventarioActual') && errores.inventarioActual && <p className={cls.errorText}>{errores.inventarioActual}</p>}
          </div>
          <div>
            <label className={cls.label}>Punto de reorden (kg) <span className="text-red-500">*</span></label>
            <input type="number" min="0" step="0.1" placeholder="0.0" {...campo('puntoReorden')} {...numBlur('puntoReorden')} />
            {tocados.has('puntoReorden') && errores.puntoReorden
              ? <p className={cls.errorText}>{errores.puntoReorden}</p>
              : <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Genera alerta cuando el inventario baja de este nivel.</p>
            }
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className={cls.label}>Notas</label>
          <textarea
            rows={3}
            placeholder="Proveedor, características, especificaciones..."
            value={form.notas}
            onChange={e => handleChange('notas', e.target.value)}
            className={`${cls.input} resize-none`}
          />
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button onClick={handleCancelar} className={cls.btnSecondary} disabled={guardando}>
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={guardando} className={cls.btnPrimary}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear material'}
          </button>
        </div>
      </div>
    </div>
  )
}
