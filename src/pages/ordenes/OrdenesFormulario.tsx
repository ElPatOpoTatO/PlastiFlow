import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrden, useOrdenes, crearOrden, actualizarOrden } from '../../hooks/useOrdenes'
import { useMateriales } from '../../hooks/useMateriales'
import { useMaquinas } from '../../hooks/useMaquinas'
import { useMoldes } from '../../hooks/useMoldes'
import { useClientes } from '../../hooks/useClientes'
import { useApp } from '../../context/AppContext'
import { calcularDatosOrden, formatearFecha, formatearNumero, formatearHoras } from '../../utils/calculos'
import { colorProyeccion, cls } from '../../utils/ui'
import type { EstadoOrden, PrioridadOrden, TipoOrden, FrecuenciaOrden } from '../../types'

const HSL_PALETTE = Array.from({ length: 16 }, (_, i) =>
  `hsl(${Math.floor(i * 360 / 16)}, 77%, 61%)`
)

interface Props { id?: string; onGuardado?: () => void; onCancelado?: () => void }

type Form = {
  clienteId: string; producto: string; cantidadRequerida: string
  moldeId: string; maquinaId: string; materialId: string
  fechaInicio: string; fechaEntrega: string
  prioridad: PrioridadOrden; tipoOrden: TipoOrden
  frecuencia: FrecuenciaOrden | ''; color: string; estado: EstadoOrden; notasInternas: string
}

type Errores = Partial<Record<keyof Form, string>>

const FORM_VACIO: Form = {
  clienteId: '', producto: '', cantidadRequerida: '',
  moldeId: '', maquinaId: '', materialId: '',
  fechaInicio: '', fechaEntrega: '',
  prioridad: 'media', tipoOrden: 'unico',
  frecuencia: '', color: 'hsl(202, 77%, 61%)', estado: 'pendiente', notasInternas: '',
}

function validar(f: Form): Errores {
  const e: Errores = {}
  if (!f.producto.trim()) e.producto = 'El producto es requerido'
  const cant = parseInt(f.cantidadRequerida)
  if (!f.cantidadRequerida || isNaN(cant) || cant < 1) e.cantidadRequerida = 'Debe ser al menos 1 pieza'
  if (!f.moldeId) e.moldeId = 'Selecciona un molde'
  if (!f.materialId) e.materialId = 'Selecciona un material'
  if (!f.fechaInicio) e.fechaInicio = 'La fecha de inicio es requerida'
  if (!f.fechaEntrega) e.fechaEntrega = 'La fecha de entrega es requerida'
  if (f.fechaInicio && f.fechaEntrega && f.fechaEntrega < f.fechaInicio)
    e.fechaEntrega = 'La entrega debe ser posterior al inicio'
  if (f.tipoOrden === 'recurrente' && !f.frecuencia) e.frecuencia = 'Selecciona la frecuencia'
  return e
}

export default function OrdenesFormulario({ id, onGuardado, onCancelado }: Props) {
  const { perfilActivoId } = useApp()
  const navigate = useNavigate()
  const ordenExistente = useOrden(id)
  const materiales = useMateriales(perfilActivoId)
  const maquinas = useMaquinas(perfilActivoId)
  const moldes = useMoldes(perfilActivoId)
  const clientes = useClientes(perfilActivoId)
  const todasOrdenes = useOrdenes(perfilActivoId)

  const [form, setForm] = useState<Form>(FORM_VACIO)
  const [errores, setErrores] = useState<Errores>({})
  const [tocados, setTocados] = useState<Set<keyof Form>>(new Set())
  const [guardando, setGuardando] = useState(false)
  const esEdicion = !!id

  useEffect(() => {
    if (ordenExistente) {
      setForm({
        clienteId: ordenExistente.clienteId, producto: ordenExistente.producto,
        cantidadRequerida: String(ordenExistente.cantidadRequerida),
        moldeId: ordenExistente.moldeId, maquinaId: ordenExistente.maquinaId,
        materialId: ordenExistente.materialId, fechaInicio: ordenExistente.fechaInicio,
        fechaEntrega: ordenExistente.fechaEntrega, prioridad: ordenExistente.prioridad,
        tipoOrden: ordenExistente.tipoOrden, frecuencia: ordenExistente.frecuencia ?? '',
        color: ordenExistente.color ?? '#3B82F6',
        estado: ordenExistente.estado, notasInternas: ordenExistente.notasInternas,
      })
    }
  }, [ordenExistente])

  const handleChange = (campo: keyof Form, valor: string) => {
    const nuevoForm = { ...form, [campo]: valor }
    setForm(nuevoForm)
    setTocados(t => new Set(t).add(campo))
    setErrores(prev => ({ ...prev, [campo]: validar(nuevoForm)[campo] }))
  }

  // Entidades seleccionadas
  const moldeSeleccionado = useMemo(() => moldes.find(m => m.id === form.moldeId), [moldes, form.moldeId])
  const materialSeleccionado = useMemo(() => materiales.find(m => m.id === form.materialId), [materiales, form.materialId])
  const maquinaSeleccionada = useMemo(() => maquinas.find(m => m.id === form.maquinaId), [maquinas, form.maquinaId])

  // Cálculos en tiempo real (sección 9.3)
  const calculos = useMemo(() => {
    const cant = parseInt(form.cantidadRequerida)
    if (!moldeSeleccionado || !materialSeleccionado || !cant || cant < 1 || !form.fechaInicio || !form.fechaEntrega) return null
    return calcularDatosOrden(
      { cantidadRequerida: cant, fechaInicio: form.fechaInicio, fechaEntrega: form.fechaEntrega },
      moldeSeleccionado,
      materialSeleccionado,
      maquinaSeleccionada
    )
  }, [moldeSeleccionado, materialSeleccionado, maquinaSeleccionada, form.cantidadRequerida, form.fechaInicio, form.fechaEntrega])

  // ── Detección de conflictos de máquina ──
  const conflictos = useMemo(() => {
    if (!form.maquinaId || !form.fechaInicio || !form.fechaEntrega) return []
    return todasOrdenes
      .filter(o => o.maquinaId === form.maquinaId && o.id !== id && o.estado !== 'entregado')
      .map(o => {
        // Solapamiento: A empieza antes de que B termine Y B empieza antes de que A termine
        const seEnciman = form.fechaInicio < o.fechaEntrega && o.fechaInicio < form.fechaEntrega
        // Adyacente: una empieza exactamente cuando la otra termina
        const esAdyacente = form.fechaInicio === o.fechaEntrega || form.fechaEntrega === o.fechaInicio
        if (seEnciman) return { orden: o, tipo: 'error' as const }
        if (esAdyacente) return { orden: o, tipo: 'advertencia' as const }
        return null
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
  }, [form.maquinaId, form.fechaInicio, form.fechaEntrega, todasOrdenes, id])

  const handleGuardar = async () => {
    const todosErrores = validar(form)
    setErrores(todosErrores)
    setTocados(new Set(Object.keys(form) as (keyof Form)[]))
    if (Object.keys(todosErrores).length > 0) return
    setGuardando(true)
    try {
      const datos = {
        clienteId: form.clienteId, producto: form.producto.trim(),
        cantidadRequerida: parseInt(form.cantidadRequerida),
        moldeId: form.moldeId, maquinaId: form.maquinaId, materialId: form.materialId,
        fechaInicio: form.fechaInicio, fechaEntrega: form.fechaEntrega,
        prioridad: form.prioridad, tipoOrden: form.tipoOrden,
        frecuencia: form.tipoOrden === 'recurrente' ? (form.frecuencia as FrecuenciaOrden) : undefined,
        color: form.color,
        estado: form.estado, notasInternas: form.notasInternas.trim(),
        perfilId: perfilActivoId!,
      }
      if (esEdicion) await actualizarOrden(id!, datos)
      else await crearOrden(datos)
      if (onGuardado) onGuardado()
      else navigate('/ordenes')
    } finally { setGuardando(false) }
  }

  const handleCancelar = () => {
    if (onCancelado) onCancelado()
    else navigate(esEdicion ? `/ordenes/${id}` : '/ordenes')
  }

  const sel = (k: keyof Form) => ({
    value: form[k] as string,
    onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => handleChange(k, e.target.value),
    className: `${cls.select} ${tocados.has(k) && errores[k] ? 'border-red-400 focus:ring-red-400' : ''}`,
  })

  const inp = (k: keyof Form) => ({
    value: form[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(k, e.target.value),
    className: `${cls.input} ${tocados.has(k) && errores[k] ? 'border-red-400 focus:ring-red-400' : ''}`,
  })

  const err = (k: keyof Form) =>
    tocados.has(k) && errores[k] ? <p className={cls.errorText}>{errores[k]}</p> : null

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handleCancelar} className={cls.btnGhost}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className={cls.pageTitle}>{esEdicion ? 'Editar orden' : 'Nueva orden de producción'}</h1>
      </div>

      <div className="space-y-5">
        {/* Sección: Identificación */}
        <div className={`${cls.card} p-5 space-y-4`}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Identificación</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cls.label}>Cliente</label>
              <select {...sel('clienteId')}>
                <option value="">— Selecciona un cliente —</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              {err('clienteId')}
              {clientes.length === 0 && <p className="text-xs text-orange-500 mt-1">No hay clientes registrados. <a href="/clientes/nuevo" className="underline">Crear cliente</a></p>}
            </div>
            <div>
              <label className={cls.label}>Producto / Descripción <span className="text-red-500">*</span></label>
              <input placeholder="Ej. Tapa rosca 500ml blanca" {...inp('producto')} />
              {err('producto')}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={cls.label}>Cantidad requerida (piezas) <span className="text-red-500">*</span></label>
              <input type="number" min="1" step="1" placeholder="Ej. 10000" {...inp('cantidadRequerida')} />
              {err('cantidadRequerida')}
            </div>
            <div>
              <label className={cls.label}>Prioridad</label>
              <select value={form.prioridad} onChange={e => handleChange('prioridad', e.target.value)} className={cls.select}>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
            <div>
              <label className={cls.label}>Estado</label>
              <select value={form.estado} onChange={e => handleChange('estado', e.target.value)} className={cls.select}>
                <option value="pendiente">Pendiente</option>
                <option value="en_produccion">En producción</option>
                <option value="listo">Listo</option>
                <option value="entregado">Entregado</option>
                <option value="con_riesgo">Con riesgo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cls.label}>Tipo de orden</label>
              <select value={form.tipoOrden} onChange={e => handleChange('tipoOrden', e.target.value)} className={cls.select}>
                <option value="unico">Único</option>
                <option value="recurrente">Recurrente</option>
              </select>
            </div>
            {form.tipoOrden === 'recurrente' && (
              <div>
                <label className={cls.label}>Frecuencia <span className="text-red-500">*</span></label>
                <select value={form.frecuencia} onChange={e => handleChange('frecuencia', e.target.value)}
                  className={`${cls.select} ${tocados.has('frecuencia') && errores.frecuencia ? 'border-red-400' : ''}`}>
                  <option value="">— Selecciona frecuencia —</option>
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                  <option value="bimestral">Bimestral</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="personalizado">Personalizado</option>
                </select>
                {err('frecuencia')}
              </div>
            )}
          </div>
        </div>

        {/* Sección: Recursos */}
        <div className={`${cls.card} p-5 space-y-4`}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recursos asignados</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cls.label}>Molde <span className="text-red-500">*</span></label>
              <select {...sel('moldeId')}>
                <option value="">— Selecciona un molde —</option>
                {moldes.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}{m.identificador ? ` (${m.identificador})` : ''} — {m.numeroCavidades} cav.
                  </option>
                ))}
              </select>
              {err('moldeId')}
              {moldes.length === 0 && <p className="text-xs text-orange-500 mt-1">No hay moldes. <a href="/moldes/nuevo" className="underline">Crear molde</a></p>}
            </div>
            <div>
              <label className={cls.label}>Material <span className="text-red-500">*</span></label>
              <select {...sel('materialId')}>
                <option value="">— Selecciona un material —</option>
                {materiales.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}{m.identificador ? ` (${m.identificador})` : ''} — Merma {m.mermaEstandar}%
                  </option>
                ))}
              </select>
              {err('materialId')}
            </div>
          </div>

          <div>
            <label className={cls.label}>Máquina asignada</label>
            <select value={form.maquinaId} onChange={e => handleChange('maquinaId', e.target.value)} className={cls.select}>
              <option value="">— Sin máquina asignada (opcional) —</option>
              {maquinas.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nombre}{m.identificador ? ` (${m.identificador})` : ''} — {m.estado === 'activa' ? '✓ Activa' : m.estado === 'mantenimiento' ? '⚠ Mantenimiento' : '✗ Inactiva'}
                </option>
              ))}
            </select>
          </div>

          {/* Conflictos de máquina */}
          {conflictos.length > 0 && (
            <div className="space-y-2">
              {conflictos.map(c => (
                <div
                  key={c.orden.id}
                  className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${
                    c.tipo === 'error'
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                      : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300'
                  }`}
                >
                  <span className="shrink-0 mt-0.5">{c.tipo === 'error' ? '⛔' : '⚠️'}</span>
                  <span>
                    {c.tipo === 'error'
                      ? `Conflicto: la orden ${c.orden.folio} (${c.orden.producto}) usa la misma máquina del ${c.orden.fechaInicio} al ${c.orden.fechaEntrega} y las fechas se solapan.`
                      : `Advertencia: la orden ${c.orden.folio} (${c.orden.producto}) en la misma máquina es adyacente (termina/empieza el mismo día).`
                    }
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección: Fechas */}
        <div className={`${cls.card} p-5 space-y-4`}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Fechas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cls.label}>Fecha de inicio <span className="text-red-500">*</span></label>
              <input type="date" {...inp('fechaInicio')} />
              {err('fechaInicio')}
            </div>
            <div>
              <label className={cls.label}>Fecha de entrega <span className="text-red-500">*</span></label>
              <input type="date" {...inp('fechaEntrega')} />
              {err('fechaEntrega')}
            </div>
          </div>
        </div>

        {/* Panel de cálculos en tiempo real */}
        {calculos && (
          <div className={`border-2 rounded-xl p-5 space-y-4 ${
            calculos.proyeccionEstado === 'verde' ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' :
            calculos.proyeccionEstado === 'amarillo' ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20' :
            'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Proyección de producción</h2>
              <span className={`text-sm font-bold ${colorProyeccion(calculos.proyeccionEstado)}`}>
                {calculos.proyeccionEstado === 'verde' ? '✅ A tiempo' :
                 calculos.proyeccionEstado === 'amarillo' ? '⚠️ Ajustado' : '🔴 En riesgo'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Piezas / hora</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{calculos.piezasPorHora.toLocaleString('es-MX')}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tiempo estimado</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatearHoras(calculos.tiempoEstimadoHoras)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Material con merma</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatearNumero(calculos.materialConMermaKg)} kg</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Holgura</p>
                <p className={`text-xl font-bold ${colorProyeccion(calculos.proyeccionEstado)}`}>
                  {calculos.margenDias > 0 ? `+${calculos.margenDias}` : calculos.margenDias} días
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-700">
              <span>Fin estimado: <strong className="text-gray-700 dark:text-gray-300">{formatearFecha(calculos.fechaEstimadaFin)}</strong></span>
              <span>Material neto: <strong className="text-gray-700 dark:text-gray-300">{formatearNumero(calculos.materialNetoKg)} kg</strong></span>
              <span>Merma: <strong className="text-gray-700 dark:text-gray-300">{formatearNumero(calculos.materialConMermaKg - calculos.materialNetoKg)} kg</strong></span>
            </div>
          </div>
        )}

        {/* Color en calendario */}
        <div className={`${cls.card} p-5 space-y-3`}>
          <label className={cls.label}>Color en calendario</label>
          <div className="flex flex-wrap gap-2">
            {HSL_PALETTE.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => handleChange('color', color)}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${
                  form.color === color
                    ? 'border-gray-900 dark:border-white scale-110 shadow-lg'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Notas */}
        <div className={`${cls.card} p-5`}>
          <label className={cls.label}>Notas internas</label>
          <textarea rows={3} placeholder="Instrucciones especiales, observaciones del equipo..."
            value={form.notasInternas} onChange={e => handleChange('notasInternas', e.target.value)}
            className={`${cls.input} resize-none`} />
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3">
          <button onClick={handleCancelar} className={cls.btnSecondary} disabled={guardando}>Cancelar</button>
          <button onClick={handleGuardar} disabled={guardando} className={cls.btnPrimary}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear orden'}
          </button>
        </div>
      </div>
    </div>
  )
}
