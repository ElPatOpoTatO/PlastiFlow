// ============================================================
// PlastiFlow — Tipos TypeScript Centralizados
// ============================================================

// ----------------------------
// Enums
// ----------------------------

export type EstadoMaquina = 'activa' | 'mantenimiento' | 'inactiva'

export type EstadoOrden =
  | 'pendiente'
  | 'en_produccion'
  | 'listo'
  | 'entregado'
  | 'con_riesgo'

export type PrioridadOrden = 'alta' | 'media' | 'baja'

export type TipoOrden = 'recurrente' | 'unico'

export type FrecuenciaOrden = 'semanal' | 'quincenal' | 'mensual' | 'bimestral' | 'trimestral' | 'personalizado'

export type ProyeccionEstado = 'verde' | 'amarillo' | 'rojo'

export type TipoAlerta = 'entrega_proxima' | 'proyeccion_ajustada' | 'inventario_bajo'

export type PrioridadAlerta = 'alta' | 'media' | 'baja'

// ----------------------------
// Entidades principales
// ----------------------------

export interface Maquina {
  id: string
  nombre: string
  identificador: string
  tonelaje: number
  eficiencia: number            // %
  moldeAnchoMax: number         // mm — ancho máx. del molde
  moldeAltoMax: number          // mm — alto máx. del molde
  moldeEspesorMax: number       // mm — espesor/profundidad máx. del molde
  moldeEspesorMin: number       // mm — espesor mínimo del molde (plato)
  capacidadInyeccionCm3: number // cm³
  pesoInyeccionMaxG: number     // g
  distanciaEntreColumnasMm: number // mm
  aperturaMaximaMm: number      // mm
  color?: string                // color HSL para el calendario
  operador: string
  horasOperacion: number
  estado: EstadoMaquina
  notas: string
  perfilId: string
  fechaCreacion: string         // ISO 8601
  fechaModificacion: string
}

export interface Material {
  id: string
  nombre: string
  identificador: string
  mermaEstandar: number         // %
  inventarioActual: number      // kg
  puntoReorden: number          // kg
  notas: string
  perfilId: string
  fechaCreacion: string
  fechaModificacion: string
}

export interface Molde {
  id: string
  nombre: string
  identificador: string
  numeroCavidades: number
  dimensionAncho: number        // mm
  dimensionAlto: number         // mm
  dimensionProfundidad: number  // mm
  productos: string
  materialesCompatibles: string[] // IDs de materiales
  tiempoCiclo: number           // segundos
  pesoPorDisparo: number        // gramos
  eficiencia: number            // %
  notas: string
  perfilId: string
  fechaCreacion: string
  fechaModificacion: string
}

export interface Cliente {
  id: string
  nombre: string
  identificador: string
  notas: string
  perfilId: string
  fechaCreacion: string
  fechaModificacion: string
}

export interface OrdenProduccion {
  id: string
  folio: string
  clienteId: string
  producto: string
  cantidadRequerida: number
  moldeId: string
  maquinaId: string
  materialId: string
  fechaInicio: string           // ISO 8601
  fechaEntrega: string          // ISO 8601
  prioridad: PrioridadOrden
  tipoOrden: TipoOrden
  frecuencia?: FrecuenciaOrden
  color?: string                // hex color para el calendario
  estado: EstadoOrden
  notasInternas: string
  perfilId: string
  fechaCreacion: string
  fechaModificacion: string
}

// ----------------------------
// Cálculos derivados (no se persisten, se calculan en tiempo real)
// ----------------------------

export interface CalculosOrden {
  piezasPorHora: number
  tiempoEstimadoHoras: number
  materialNetoKg: number
  materialConMermaKg: number
  fechaEstimadaFin: string      // ISO 8601
  margenDias: number
  proyeccionEstado: ProyeccionEstado
}

export interface CalculosMolde {
  piezasPorHora: number
  materialPorHoraKg: number
  materialPorHoraConMermaKg: number | null // null si no hay material seleccionado
}

// ----------------------------
// Sistema de Perfiles
// ----------------------------

export interface ConfiguracionPerfil {
  diasAlertaEntrega: number     // default: 3
  alertaEntregaActiva: boolean
  alertaProyeccionActiva: boolean
  alertaInventarioActiva: boolean
  zonaHoraria: string
  moneda: string
  horasLaboralesDia: number     // default: 8
  diasHabilMes: number          // default: 22
  modo247: boolean              // default: false — fábrica 24 hrs / 31 días
}

export interface Perfil {
  id: string
  nombre: string
  descripcion: string
  fechaCreacion: string
  ultimaModificacion: string
  esRespaldo: boolean
  configuracion: ConfiguracionPerfil
}

export interface ArchivoPlastiflow {
  version: string
  perfil: Perfil
  maquinas: Maquina[]
  moldes: Molde[]
  clientes: Cliente[]
  materiales: Material[]
  ordenes: OrdenProduccion[]
  configuracion: ConfiguracionPerfil
}

// ----------------------------
// Calendario / Registro diario
// ----------------------------

export interface RegistroDiario {
  id: string
  ordenId: string
  fecha: string           // ISO date YYYY-MM-DD
  programado: number      // piezas planificadas para ese día
  producido: number       // piezas realmente producidas (ingreso manual)
  perfilId: string
}

// ----------------------------
// Alertas
// ----------------------------

export interface Alerta {
  id: string
  tipo: TipoAlerta
  prioridad: PrioridadAlerta
  mensaje: string
  ordenId?: string
  materialId?: string
  folio?: string
  vista: boolean
  fechaGeneracion: string
  perfilId: string
}

// ----------------------------
// Estado de la aplicación (AppContext)
// ----------------------------

export interface AppState {
  perfilActivoId: string | null
  tema: 'claro' | 'oscuro'
}
