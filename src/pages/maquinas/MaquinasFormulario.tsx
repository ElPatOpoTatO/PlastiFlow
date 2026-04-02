import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMaquina, crearMaquina, actualizarMaquina } from '../../hooks/useMaquinas'
import { useApp } from '../../context/AppContext'
import { cls } from '../../utils/ui'
import type { EstadoMaquina } from '../../types'

const HSL_PALETTE = Array.from({ length: 16 }, (_, i) =>
  `hsl(${Math.floor(i * 360 / 16)}, 77%, 61%)`
)

interface Props { id?: string; onGuardado?: () => void; onCancelado?: () => void }

type Form = {
  nombre: string; identificador: string; estado: EstadoMaquina
  tonelaje: string; eficiencia: string
  moldeAnchoMax: string; moldeAltoMax: string; moldeEspesorMax: string; moldeEspesorMin: string
  capacidadInyeccionCm3: string; pesoInyeccionMaxG: string
  distanciaEntreColumnasMm: string; aperturaMaximaMm: string
  operador: string; horasOperacion: string; notas: string
}

type Errores = Partial<Record<keyof Form, string>>

const FORM_VACIO: Form = {
  nombre: '', identificador: '', estado: 'activa',
  tonelaje: '', eficiencia: '',
  moldeAnchoMax: '', moldeAltoMax: '', moldeEspesorMax: '', moldeEspesorMin: '',
  capacidadInyeccionCm3: '', pesoInyeccionMaxG: '',
  distanciaEntreColumnasMm: '', aperturaMaximaMm: '',
  operador: '', horasOperacion: '', notas: '',
}

function validar(f: Form): Errores {
  const e: Errores = {}
  if (!f.nombre.trim()) e.nombre = 'El nombre es requerido'
  const ton = parseFloat(f.tonelaje)
  if (f.tonelaje !== '' && (isNaN(ton) || ton <= 0)) e.tonelaje = 'Debe ser un número positivo'
  const eff = parseFloat(f.eficiencia)
  if (f.eficiencia !== '' && (isNaN(eff) || eff < 0 || eff > 100)) e.eficiencia = 'Debe estar entre 0 y 100'
  const hrs = parseFloat(f.horasOperacion)
  if (isNaN(hrs) || hrs < 0) e.horasOperacion = 'No puede ser negativo'
  return e
}

function posNum(val: string) { return parseFloat(val) || 0 }

export default function MaquinasFormulario({ id, onGuardado, onCancelado }: Props) {
  const { perfilActivoId } = useApp()
  const navigate = useNavigate()
  const maquinaExistente = useMaquina(id)
  const [form, setForm] = useState<Form>(FORM_VACIO)
  const [color, setColor] = useState<string>('hsl(202, 77%, 61%)')
  const [errores, setErrores] = useState<Errores>({})
  const [tocados, setTocados] = useState<Set<keyof Form>>(new Set())
  const [guardando, setGuardando] = useState(false)
  const esEdicion = !!id

  useEffect(() => {
    if (maquinaExistente) {
      setForm({
        nombre: maquinaExistente.nombre,
        identificador: maquinaExistente.identificador,
        estado: maquinaExistente.estado,
        tonelaje: maquinaExistente.tonelaje ? String(maquinaExistente.tonelaje) : '',
        eficiencia: maquinaExistente.eficiencia ? String(maquinaExistente.eficiencia) : '',
        moldeAnchoMax: maquinaExistente.moldeAnchoMax ? String(maquinaExistente.moldeAnchoMax) : '',
        moldeAltoMax: maquinaExistente.moldeAltoMax ? String(maquinaExistente.moldeAltoMax) : '',
        moldeEspesorMax: maquinaExistente.moldeEspesorMax ? String(maquinaExistente.moldeEspesorMax) : '',
        moldeEspesorMin: maquinaExistente.moldeEspesorMin ? String(maquinaExistente.moldeEspesorMin) : '',
        capacidadInyeccionCm3: maquinaExistente.capacidadInyeccionCm3 ? String(maquinaExistente.capacidadInyeccionCm3) : '',
        pesoInyeccionMaxG: maquinaExistente.pesoInyeccionMaxG ? String(maquinaExistente.pesoInyeccionMaxG) : '',
        distanciaEntreColumnasMm: maquinaExistente.distanciaEntreColumnasMm ? String(maquinaExistente.distanciaEntreColumnasMm) : '',
        aperturaMaximaMm: maquinaExistente.aperturaMaximaMm ? String(maquinaExistente.aperturaMaximaMm) : '',
        operador: maquinaExistente.operador,
        horasOperacion: maquinaExistente.horasOperacion ? String(maquinaExistente.horasOperacion) : '',
        notas: maquinaExistente.notas,
      })
      if (maquinaExistente.color) setColor(maquinaExistente.color)
    }
  }, [maquinaExistente])

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
      const datos = {
        nombre: form.nombre.trim(),
        identificador: form.identificador.trim(),
        estado: form.estado,
        tonelaje: posNum(form.tonelaje),
        eficiencia: posNum(form.eficiencia),
        moldeAnchoMax: posNum(form.moldeAnchoMax),
        moldeAltoMax: posNum(form.moldeAltoMax),
        moldeEspesorMax: posNum(form.moldeEspesorMax),
        moldeEspesorMin: posNum(form.moldeEspesorMin),
        capacidadInyeccionCm3: posNum(form.capacidadInyeccionCm3),
        pesoInyeccionMaxG: posNum(form.pesoInyeccionMaxG),
        distanciaEntreColumnasMm: posNum(form.distanciaEntreColumnasMm),
        aperturaMaximaMm: posNum(form.aperturaMaximaMm),
        operador: form.operador.trim(),
        horasOperacion: posNum(form.horasOperacion),
        color,
        notas: form.notas.trim(),
        perfilId: perfilActivoId!,
      }
      if (esEdicion) await actualizarMaquina(id!, datos)
      else await crearMaquina(datos)
      if (onGuardado) onGuardado()
      else navigate('/maquinas')
    } finally { setGuardando(false) }
  }

  const handleCancelar = () => {
    if (onCancelado) onCancelado()
    else navigate(esEdicion ? `/maquinas/${id}` : '/maquinas')
  }

  const inp = (k: keyof Form) => ({
    value: form[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      handleChange(k, e.target.value),
    className: `${cls.input} ${tocados.has(k) && errores[k] ? 'border-red-400 focus:ring-red-400' : ''}`,
  })

  // Normaliza campo numérico al perder foco: si está vacío o NaN → usa el mínimo
  const numBlur = (k: keyof Form, min = 0) => ({
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      if (e.target.value === '' || isNaN(Number(e.target.value))) {
        handleChange(k, String(min))
      }
    },
  })

  const err = (k: keyof Form) =>
    tocados.has(k) && errores[k] ? <p className={cls.errorText}>{errores[k]}</p> : null

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handleCancelar} className={cls.btnGhost}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className={cls.pageTitle}>{esEdicion ? 'Editar máquina' : 'Nueva máquina'}</h1>
      </div>

      <div className={`${cls.card} p-6 space-y-6`}>

        {/* ── Identificación ── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Identificación</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={cls.label}>Nombre <span className="text-red-500">*</span></label>
              <input placeholder="Ej. Inyectora Principal" {...inp('nombre')} />
              {err('nombre')}
            </div>
            <div>
              <label className={cls.label}>Identificador</label>
              <input placeholder="Ej. M-01" {...inp('identificador')} />
            </div>
            <div>
              <label className={cls.label}>Estado</label>
              <select value={form.estado} onChange={e => handleChange('estado', e.target.value)} className={cls.select}>
                <option value="activa">Activa</option>
                <option value="mantenimiento">En mantenimiento</option>
                <option value="inactiva">Inactiva</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Color ── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Color en el calendario</p>
          <div className="flex flex-wrap gap-2">
            {HSL_PALETTE.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-110 ring-2 ring-offset-2 ring-gray-900 dark:ring-white' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        {/* ── Capacidades generales ── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Capacidades generales</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cls.label}>Tonelaje / Fuerza de cierre (ton)</label>
              <input type="number" min="0" step="1" placeholder="Ej. 250" {...inp('tonelaje')} {...numBlur('tonelaje')} />
              {err('tonelaje')}
            </div>
            <div>
              <label className={cls.label}>Eficiencia (%)</label>
              <input type="number" min="0" max="100" step="1" placeholder="Ej. 90" {...inp('eficiencia')} {...numBlur('eficiencia')} />
              {err('eficiencia')}
            </div>
          </div>
        </div>

        {/* ── Dimensiones máx. de molde ── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Dimensiones de molde (mm)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={cls.label}>Ancho máx.</label>
              <input type="number" min="0" step="1" placeholder="Ej. 600" {...inp('moldeAnchoMax')} {...numBlur('moldeAnchoMax')} />
            </div>
            <div>
              <label className={cls.label}>Alto máx.</label>
              <input type="number" min="0" step="1" placeholder="Ej. 500" {...inp('moldeAltoMax')} {...numBlur('moldeAltoMax')} />
            </div>
            <div>
              <label className={cls.label}>Espesor máx.</label>
              <input type="number" min="0" step="1" placeholder="Ej. 400" {...inp('moldeEspesorMax')} {...numBlur('moldeEspesorMax')} />
            </div>
            <div>
              <label className={cls.label}>Espesor mín.</label>
              <input type="number" min="0" step="1" placeholder="Ej. 150" {...inp('moldeEspesorMin')} {...numBlur('moldeEspesorMin')} />
            </div>
          </div>
        </div>

        {/* ── Capacidades de inyección ── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Capacidades de inyección</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cls.label}>Cap. inyección (cm³)</label>
              <input type="number" min="0" step="1" placeholder="Ej. 450" {...inp('capacidadInyeccionCm3')} {...numBlur('capacidadInyeccionCm3')} />
            </div>
            <div>
              <label className={cls.label}>Peso iny. máx. (g)</label>
              <input type="number" min="0" step="1" placeholder="Ej. 400" {...inp('pesoInyeccionMaxG')} {...numBlur('pesoInyeccionMaxG')} />
            </div>
            <div>
              <label className={cls.label}>Dist. entre columnas (mm)</label>
              <input type="number" min="0" step="1" placeholder="Ej. 520" {...inp('distanciaEntreColumnasMm')} {...numBlur('distanciaEntreColumnasMm')} />
            </div>
            <div>
              <label className={cls.label}>Apertura máxima (mm)</label>
              <input type="number" min="0" step="1" placeholder="Ej. 800" {...inp('aperturaMaximaMm')} {...numBlur('aperturaMaximaMm')} />
            </div>
          </div>
        </div>

        {/* ── Operación ── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Operación</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cls.label}>Operador asignado</label>
              <input placeholder="Nombre del operador" {...inp('operador')} />
            </div>
            <div>
              <label className={cls.label}>Horas de operación acumuladas</label>
              <input type="number" min="0" step="0.5" {...inp('horasOperacion')} {...numBlur('horasOperacion')} />
              {err('horasOperacion')}
            </div>
          </div>
        </div>

        {/* ── Notas ── */}
        <div>
          <label className={cls.label}>Notas</label>
          <textarea rows={3} placeholder="Observaciones, historial de mantenimiento, etc."
            value={form.notas} onChange={e => handleChange('notas', e.target.value)}
            className={`${cls.input} resize-none`} />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button onClick={handleCancelar} className={cls.btnSecondary} disabled={guardando}>Cancelar</button>
          <button onClick={handleGuardar} disabled={guardando} className={cls.btnPrimary}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear máquina'}
          </button>
        </div>
      </div>
    </div>
  )
}
