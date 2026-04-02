import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMolde, crearMolde, actualizarMolde } from '../../hooks/useMoldes'
import { useMateriales } from '../../hooks/useMateriales'
import { useApp } from '../../context/AppContext'
import { useConfiguracion } from '../../hooks/usePerfiles'
import { calcularPanelMolde, formatearNumero } from '../../utils/calculos'
import { cls } from '../../utils/ui'

interface Props { id?: string; onGuardado?: () => void; onCancelado?: () => void }

type Form = {
  nombre: string; identificador: string; numeroCavidades: string
  dimensionAncho: string; dimensionAlto: string; dimensionProfundidad: string
  productos: string; tiempoCiclo: string; pesoPorDisparo: string
  eficiencia: string; notas: string
}
type Errores = Partial<Record<keyof Form, string>>

const FORM_VACIO: Form = {
  nombre: '', identificador: '', numeroCavidades: '', dimensionAncho: '',
  dimensionAlto: '', dimensionProfundidad: '', productos: '', tiempoCiclo: '',
  pesoPorDisparo: '', eficiencia: '', notas: '',
}

function validar(f: Form): Errores {
  const e: Errores = {}
  if (!f.nombre.trim()) e.nombre = 'El nombre es requerido'
  const cav = parseInt(f.numeroCavidades)
  if (!f.numeroCavidades || isNaN(cav) || cav < 1) e.numeroCavidades = 'Debe ser al menos 1'
  const tc = parseFloat(f.tiempoCiclo)
  if (!f.tiempoCiclo || isNaN(tc) || tc <= 0) e.tiempoCiclo = 'Debe ser mayor a 0'
  const pp = parseFloat(f.pesoPorDisparo)
  if (!f.pesoPorDisparo || isNaN(pp) || pp <= 0) e.pesoPorDisparo = 'Debe ser mayor a 0'
  return e
}

export default function MoldesFormulario({ id, onGuardado, onCancelado }: Props) {
  const { perfilActivoId } = useApp()
  const navigate = useNavigate()
  const moldeExistente = useMolde(id)
  const materiales = useMateriales(perfilActivoId)
  const config = useConfiguracion(perfilActivoId)

  const [form, setForm] = useState<Form>(FORM_VACIO)
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState<string[]>([])
  const [errores, setErrores] = useState<Errores>({})
  const [tocados, setTocados] = useState<Set<keyof Form>>(new Set())
  const [guardando, setGuardando] = useState(false)
  const esEdicion = !!id

  useEffect(() => {
    if (moldeExistente) {
      setForm({
        nombre: moldeExistente.nombre,
        identificador: moldeExistente.identificador,
        numeroCavidades: String(moldeExistente.numeroCavidades),
        dimensionAncho: String(moldeExistente.dimensionAncho),
        dimensionAlto: String(moldeExistente.dimensionAlto),
        dimensionProfundidad: String(moldeExistente.dimensionProfundidad),
        productos: moldeExistente.productos,
        tiempoCiclo: String(moldeExistente.tiempoCiclo),
        pesoPorDisparo: String(moldeExistente.pesoPorDisparo),
        eficiencia: moldeExistente.eficiencia ? String(moldeExistente.eficiencia) : '',
        notas: moldeExistente.notas,
      })
      setMaterialesSeleccionados(moldeExistente.materialesCompatibles)
    }
  }, [moldeExistente])

  // Cálculos en tiempo real
  const calculos = useMemo(() => {
    const cav = parseInt(form.numeroCavidades)
    const tc = parseFloat(form.tiempoCiclo)
    const pp = parseFloat(form.pesoPorDisparo)
    if (!cav || !tc || !pp || cav < 1 || tc <= 0 || pp <= 0) return null
    const moldeSimulado = {
      numeroCavidades: cav, tiempoCiclo: tc, pesoPorDisparo: pp,
      id: '', nombre: '', identificador: '', dimensionAncho: 0, dimensionAlto: 0,
      dimensionProfundidad: 0, productos: '', materialesCompatibles: [], notas: '',
      eficiencia: parseFloat(form.eficiencia) || 0, perfilId: '', fechaCreacion: '', fechaModificacion: '',
    }
    // Material del primer seleccionado, si existe
    const matSeleccionado = materialesSeleccionados.length > 0
      ? materiales.find(m => m.id === materialesSeleccionados[0]) ?? null
      : null
    return calcularPanelMolde(moldeSimulado, config.horasLaboralesDia, config.diasHabilMes, matSeleccionado)
  }, [form.numeroCavidades, form.tiempoCiclo, form.pesoPorDisparo, form.eficiencia, materialesSeleccionados, materiales, config])

  const handleChange = (campo: keyof Form, valor: string) => {
    const nuevoForm = { ...form, [campo]: valor }
    setForm(nuevoForm)
    setTocados(t => new Set(t).add(campo))
    setErrores(prev => ({ ...prev, [campo]: validar(nuevoForm)[campo] }))
  }

  const toggleMaterial = (matId: string) => {
    setMaterialesSeleccionados(prev =>
      prev.includes(matId) ? prev.filter(id => id !== matId) : [...prev, matId]
    )
  }

  const handleGuardar = async () => {
    const todosErrores = validar(form)
    setErrores(todosErrores)
    setTocados(new Set(Object.keys(form) as (keyof Form)[]))
    if (Object.keys(todosErrores).length > 0) return
    setGuardando(true)
    try {
      const datos = {
        nombre: form.nombre.trim(), identificador: form.identificador.trim(),
        numeroCavidades: parseInt(form.numeroCavidades),
        dimensionAncho: parseFloat(form.dimensionAncho) || 0,
        dimensionAlto: parseFloat(form.dimensionAlto) || 0,
        dimensionProfundidad: parseFloat(form.dimensionProfundidad) || 0,
        productos: form.productos.trim(),
        materialesCompatibles: materialesSeleccionados,
        tiempoCiclo: parseFloat(form.tiempoCiclo),
        pesoPorDisparo: parseFloat(form.pesoPorDisparo),
        eficiencia: parseFloat(form.eficiencia) || 0,
        notas: form.notas.trim(), perfilId: perfilActivoId!,
      }
      if (esEdicion) await actualizarMolde(id!, datos)
      else await crearMolde(datos)
      if (onGuardado) onGuardado()
      else navigate('/moldes')
    } finally { setGuardando(false) }
  }

  const handleCancelar = () => {
    if (onCancelado) onCancelado()
    else navigate(esEdicion ? `/moldes/${id}` : '/moldes')
  }

  const inp = (k: keyof Form) => ({
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
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handleCancelar} className={cls.btnGhost}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className={cls.pageTitle}>{esEdicion ? 'Editar molde' : 'Nuevo molde'}</h1>
      </div>

      <div className={`${cls.card} p-6 space-y-5`}>
        {/* Identificación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={cls.label}>Nombre <span className="text-red-500">*</span></label>
            <input placeholder="Ej. Molde Tapa 500ml" {...inp('nombre')} />
            {tocados.has('nombre') && errores.nombre && <p className={cls.errorText}>{errores.nombre}</p>}
          </div>
          <div>
            <label className={cls.label}>Identificador</label>
            <input placeholder="Ej. MOL-07" {...inp('identificador')} />
          </div>
        </div>

        {/* Producto y cavidades */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={cls.label}>Producto(s) que produce</label>
            <input placeholder="Ej. Tapa rosca 500ml" {...inp('productos')} />
          </div>
          <div>
            <label className={cls.label}>Nº de cavidades <span className="text-red-500">*</span></label>
            <input type="number" min="1" step="1" placeholder="Ej. 4" {...inp('numeroCavidades')} {...numBlur('numeroCavidades', 1)} />
            {tocados.has('numeroCavidades') && errores.numeroCavidades && <p className={cls.errorText}>{errores.numeroCavidades}</p>}
          </div>
        </div>

        {/* Dimensiones */}
        <div>
          <label className={cls.label}>Dimensiones del molde (mm)</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <input type="number" min="0" step="1" placeholder="Ancho" {...inp('dimensionAncho')} {...numBlur('dimensionAncho')} />
              <p className="text-xs text-gray-400 mt-1 text-center">Ancho</p>
            </div>
            <div>
              <input type="number" min="0" step="1" placeholder="Alto" {...inp('dimensionAlto')} {...numBlur('dimensionAlto')} />
              <p className="text-xs text-gray-400 mt-1 text-center">Alto</p>
            </div>
            <div>
              <input type="number" min="0" step="1" placeholder="Prof." {...inp('dimensionProfundidad')} {...numBlur('dimensionProfundidad')} />
              <p className="text-xs text-gray-400 mt-1 text-center">Profundidad</p>
            </div>
          </div>
        </div>

        {/* Parámetros de producción */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={cls.label}>Tiempo de ciclo (segundos) <span className="text-red-500">*</span></label>
            <input type="number" min="0.1" step="0.5" placeholder="Ej. 30" {...inp('tiempoCiclo')} {...numBlur('tiempoCiclo', 0.1)} />
            {tocados.has('tiempoCiclo') && errores.tiempoCiclo && <p className={cls.errorText}>{errores.tiempoCiclo}</p>}
          </div>
          <div>
            <label className={cls.label}>Peso por pieza (gramos) <span className="text-red-500">*</span></label>
            <input type="number" min="0.1" step="0.1" placeholder="Ej. 45.5" {...inp('pesoPorDisparo')} {...numBlur('pesoPorDisparo', 0.1)} />
            {tocados.has('pesoPorDisparo') && errores.pesoPorDisparo && <p className={cls.errorText}>{errores.pesoPorDisparo}</p>}
          </div>
        </div>

        {/* Panel de cálculos en tiempo real */}
        {calculos && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-3">
              Cálculos en tiempo real
              {materialesSeleccionados.length > 0 && (
                <span className="ml-2 font-normal text-blue-500">· con merma de {materiales.find(m => m.id === materialesSeleccionados[0])?.nombre}</span>
              )}
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">Por hora</div>
              <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">Por día ({config.horasLaboralesDia} h)</div>
              <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">Por mes ({config.diasHabilMes} días)</div>

              <div className="bg-white dark:bg-blue-900/30 rounded-lg p-2">
                <p className="text-[10px] text-blue-400 mb-0.5">Piezas</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-200">{calculos.piezasPorHora.toLocaleString('es-MX')}</p>
              </div>
              <div className="bg-white dark:bg-blue-900/30 rounded-lg p-2">
                <p className="text-[10px] text-blue-400 mb-0.5">Piezas</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-200">{calculos.piezasPorDia.toLocaleString('es-MX')}</p>
              </div>
              <div className="bg-white dark:bg-blue-900/30 rounded-lg p-2">
                <p className="text-[10px] text-blue-400 mb-0.5">Piezas</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-200">{calculos.piezasPorMes.toLocaleString('es-MX')}</p>
              </div>

              <div className="bg-white dark:bg-blue-900/30 rounded-lg p-2">
                <p className="text-[10px] text-blue-400 mb-0.5">Material</p>
                <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{formatearNumero(calculos.kgPorHora)} kg</p>
              </div>
              <div className="bg-white dark:bg-blue-900/30 rounded-lg p-2">
                <p className="text-[10px] text-blue-400 mb-0.5">Material</p>
                <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{formatearNumero(calculos.kgPorDia)} kg</p>
              </div>
              <div className="bg-white dark:bg-blue-900/30 rounded-lg p-2">
                <p className="text-[10px] text-blue-400 mb-0.5">Material</p>
                <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{formatearNumero(calculos.kgPorMes)} kg</p>
              </div>
            </div>
          </div>
        )}

        {/* Eficiencia */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={cls.label}>Eficiencia del molde (%)</label>
            <input type="number" min="0" max="100" step="1" placeholder="Ej. 95" {...inp('eficiencia')} {...numBlur('eficiencia')} />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Rendimiento real vs. capacidad teórica.</p>
          </div>
        </div>

        {/* Materiales compatibles */}
        {materiales.length > 0 && (
          <div>
            <label className={cls.label}>Materiales compatibles</label>
            <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 min-h-[44px]">
              {materiales.map(mat => {
                const sel = materialesSeleccionados.includes(mat.id)
                return (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => toggleMaterial(mat.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      sel
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {mat.nombre}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Notas */}
        <div>
          <label className={cls.label}>Notas</label>
          <textarea rows={3} placeholder="Observaciones adicionales..."
            value={form.notas} onChange={e => handleChange('notas', e.target.value)}
            className={`${cls.input} resize-none`} />
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button onClick={handleCancelar} className={cls.btnSecondary} disabled={guardando}>Cancelar</button>
          <button onClick={handleGuardar} disabled={guardando} className={cls.btnPrimary}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear molde'}
          </button>
        </div>
      </div>
    </div>
  )
}
