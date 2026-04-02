// ============================================================
// PlastiFlow — Fórmulas y Cálculos Centralizados
// Sección 14 del spec
// ============================================================

import type { Molde, Maquina, Material, OrdenProduccion, CalculosOrden, CalculosMolde, ProyeccionEstado } from '../types'

// ----------------------------
// Cálculos del Molde (sección 6.3)
// ----------------------------

/**
 * Piezas por hora producidas por un molde.
 * Formula: floor(3600 / tiempo_ciclo_segundos) × número_de_cavidades
 */
export function calcularPiezasPorHora(molde: Molde): number {
  if (!molde.tiempoCiclo || molde.tiempoCiclo <= 0) return 0
  const base = Math.floor(3600 / molde.tiempoCiclo) * molde.numeroCavidades
  const eficiencia = molde.eficiencia > 0 ? molde.eficiencia : 100
  return Math.floor(base * (eficiencia / 100))
}

/**
 * Material consumido por hora en kg (sin merma).
 * Formula: (3600 / tiempo_ciclo) × peso_por_disparo / 1000
 */
export function calcularMaterialPorHoraKg(molde: Molde): number {
  if (!molde.tiempoCiclo || molde.tiempoCiclo <= 0) return 0
  const base = (3600 / molde.tiempoCiclo) * (molde.pesoPorDisparo / 1000)
  const eficiencia = molde.eficiencia > 0 ? molde.eficiencia : 100
  return base * (eficiencia / 100)
}

/**
 * Material consumido por hora en kg (con merma del material).
 */
export function calcularMaterialPorHoraConMermaKg(molde: Molde, material: Material): number {
  const materialBase = calcularMaterialPorHoraKg(molde)
  return materialBase * (1 + material.mermaEstandar / 100)
}

/**
 * Retorna todos los cálculos derivados de un molde dado un material opcional.
 */
export function calcularDatosMolde(molde: Molde, material?: Material | null): CalculosMolde {
  return {
    piezasPorHora: calcularPiezasPorHora(molde),
    materialPorHoraKg: calcularMaterialPorHoraKg(molde),
    materialPorHoraConMermaKg: material
      ? calcularMaterialPorHoraConMermaKg(molde, material)
      : null,
  }
}

/**
 * Panel de producción extendido: piezas y kg por hora/día/mes.
 * @param horasLaboralesDia - horas de trabajo por día (ej. 8)
 * @param diasHabilMes      - días hábiles por mes (ej. 22)
 * @param material          - material para calcular kg con merma (opcional)
 */
export function calcularPanelMolde(
  molde: Molde,
  horasLaboralesDia: number,
  diasHabilMes: number,
  material?: Material | null
): {
  piezasPorHora: number
  piezasPorDia: number
  piezasPorMes: number
  kgPorHora: number
  kgPorDia: number
  kgPorMes: number
} {
  const pph = calcularPiezasPorHora(molde)
  const kgH = material
    ? calcularMaterialPorHoraConMermaKg(molde, material)
    : calcularMaterialPorHoraKg(molde)
  const ppd = pph * horasLaboralesDia
  const ppm = ppd * diasHabilMes
  return {
    piezasPorHora: pph,
    piezasPorDia: ppd,
    piezasPorMes: ppm,
    kgPorHora: kgH,
    kgPorDia: kgH * horasLaboralesDia,
    kgPorMes: kgH * horasLaboralesDia * diasHabilMes,
  }
}

// ----------------------------
// Cálculos de la Orden de Producción (sección 9.3 y 14)
// ----------------------------

/**
 * Disparos necesarios para producir la cantidad requerida.
 * Formula: ceil(cantidad_piezas / número_de_cavidades)
 */
export function calcularDisparosNecesarios(cantidad: number, cavidades: number): number {
  if (!cavidades || cavidades <= 0) return 0
  return Math.ceil(cantidad / cavidades)
}

/**
 * Material neto requerido en kg (sin merma).
 * Formula: disparos_necesarios × peso_por_disparo_g / 1000
 */
export function calcularMaterialNetoKg(
  cantidad: number,
  molde: Molde
): number {
  const disparos = calcularDisparosNecesarios(cantidad, molde.numeroCavidades)
  return disparos * (molde.pesoPorDisparo / 1000)
}

/**
 * Material real requerido en kg (con merma).
 * Formula: material_neto × (1 + merma% / 100)
 */
export function calcularMaterialConMermaKg(materialNeto: number, merma: number): number {
  return materialNeto * (1 + merma / 100)
}

/**
 * Tiempo estimado de producción en horas.
 * Formula: cantidad / piezas_por_hora
 */
export function calcularTiempoEstimadoHoras(cantidad: number, piezasPorHora: number): number {
  if (!piezasPorHora || piezasPorHora <= 0) return 0
  return cantidad / piezasPorHora
}

/**
 * Fecha estimada de finalización sumando horas de producción a la fecha de inicio.
 * Usa horas laborales simples (24h por simplicidad en v1).
 */
export function calcularFechaEstimadaFin(fechaInicio: string, horasNecesarias: number): string {
  if (!fechaInicio) return ''
  const inicio = new Date(fechaInicio)
  const fin = new Date(inicio.getTime() + Math.ceil(horasNecesarias) * 60 * 60 * 1000)
  return fin.toISOString().split('T')[0]
}

/**
 * Margen en días entre la fecha de entrega y la fecha estimada de finalización.
 * Positivo = holgura, negativo = retraso.
 */
export function calcularMargenDias(fechaEntrega: string, fechaEstimadaFin: string): number {
  if (!fechaEntrega || !fechaEstimadaFin) return 0
  const entrega = new Date(fechaEntrega)
  const fin = new Date(fechaEstimadaFin)
  const diffMs = entrega.getTime() - fin.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Estado de la proyección basado en el margen de días.
 * > 2 días → verde | 0–2 días → amarillo | < 0 → rojo
 */
export function calcularProyeccionEstado(margenDias: number): ProyeccionEstado {
  if (margenDias > 2) return 'verde'
  if (margenDias >= 0) return 'amarillo'
  return 'rojo'
}

/**
 * Calcula todos los valores derivados de una orden de producción.
 */
export function calcularDatosOrden(
  orden: Pick<OrdenProduccion, 'cantidadRequerida' | 'fechaInicio' | 'fechaEntrega'>,
  molde: Molde,
  material: Material,
  maquina?: Pick<Maquina, 'eficiencia'> | null
): CalculosOrden {
  let piezasPorHora = calcularPiezasPorHora(molde) // ya incluye eficiencia del molde
  if (maquina && maquina.eficiencia > 0 && maquina.eficiencia < 100) {
    piezasPorHora = Math.floor(piezasPorHora * (maquina.eficiencia / 100))
  }
  const tiempoEstimadoHoras = calcularTiempoEstimadoHoras(orden.cantidadRequerida, piezasPorHora)
  const materialNetoKg = calcularMaterialNetoKg(orden.cantidadRequerida, molde)
  const materialConMermaKg = calcularMaterialConMermaKg(materialNetoKg, material.mermaEstandar)
  const fechaEstimadaFin = calcularFechaEstimadaFin(orden.fechaInicio, tiempoEstimadoHoras)
  const margenDias = calcularMargenDias(orden.fechaEntrega, fechaEstimadaFin)
  const proyeccionEstado = calcularProyeccionEstado(margenDias)

  return {
    piezasPorHora,
    tiempoEstimadoHoras,
    materialNetoKg,
    materialConMermaKg,
    fechaEstimadaFin,
    margenDias,
    proyeccionEstado,
  }
}

// ----------------------------
// Compatibilidad Máquina-Molde (sección 14.1)
// ----------------------------

/**
 * Un molde es compatible con una máquina si cada dimensión del molde ≤ la dimensión máxima de la máquina.
 * Solo verifica dimensiones que estén definidas (> 0) en la máquina.
 */
export function esMoldeCompatibleConMaquina(molde: Molde, maquina: Maquina): boolean {
  if (maquina.moldeAnchoMax > 0 && molde.dimensionAncho > maquina.moldeAnchoMax) return false
  if (maquina.moldeAltoMax > 0 && molde.dimensionAlto > maquina.moldeAltoMax) return false
  if (maquina.moldeEspesorMax > 0 && molde.dimensionProfundidad > maquina.moldeEspesorMax) return false
  if (maquina.moldeEspesorMin > 0 && molde.dimensionProfundidad < maquina.moldeEspesorMin) return false
  return true
}

/**
 * Dimensión máxima del molde (la mayor de ancho, alto, profundidad).
 */
export function dimensionMaximaMolde(molde: Molde): number {
  return Math.max(molde.dimensionAncho, molde.dimensionAlto, molde.dimensionProfundidad)
}

// ----------------------------
// Utilidades de formato
// ----------------------------

/**
 * Convierte fecha ISO 8601 (YYYY-MM-DD) a formato DD/MM/YYYY para display.
 */
export function formatearFecha(isoFecha: string): string {
  if (!isoFecha) return ''
  const [year, month, day] = isoFecha.split('-')
  return `${day}/${month}/${year}`
}

/**
 * Convierte fecha DD/MM/YYYY a ISO 8601 para almacenamiento.
 */
export function parsearFecha(displayFecha: string): string {
  if (!displayFecha) return ''
  const [day, month, year] = displayFecha.split('/')
  return `${year}-${month}-${day}`
}

/**
 * Formatea un número con separadores de miles y decimales.
 */
export function formatearNumero(valor: number, decimales = 2): string {
  return valor.toLocaleString('es-MX', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })
}

/**
 * Formatea horas a texto legible (ej. "3h 20min").
 */
export function formatearHoras(horas: number): string {
  const h = Math.floor(horas)
  const min = Math.round((horas - h) * 60)
  if (h === 0) return `${min}min`
  if (min === 0) return `${h}h`
  return `${h}h ${min}min`
}
