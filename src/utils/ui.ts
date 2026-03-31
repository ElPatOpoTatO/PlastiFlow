// ============================================================
// PlastiFlow — Utilidades de UI (clases Tailwind reutilizables)
// Estilo: Brutalismo — bordes rectos, sombras offset, sin gradientes
// ============================================================

import type { EstadoOrden, PrioridadOrden, EstadoMaquina, ProyeccionEstado, TipoAlerta } from '../types'

// ── Chips de estado ─────────────────────────────────────────
// Brutalismo: rounded-none, border sólido, font-bold

export function chipEstadoOrden(estado: EstadoOrden): string {
  const base = 'inline-flex items-center px-2 py-0.5 text-xs font-bold border border-current'
  const map: Record<EstadoOrden, string> = {
    pendiente:      `${base} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300`,
    en_produccion:  `${base} bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300`,
    listo:          `${base} bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300`,
    entregado:      `${base} bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300`,
    con_riesgo:     `${base} bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300`,
  }
  return map[estado] ?? base
}

export function labelEstadoOrden(estado: EstadoOrden): string {
  const map: Record<EstadoOrden, string> = {
    pendiente:      'Pendiente',
    en_produccion:  'En producción',
    listo:          'Listo',
    entregado:      'Entregado',
    con_riesgo:     'Con riesgo',
  }
  return map[estado] ?? estado
}

export function chipPrioridad(prioridad: PrioridadOrden): string {
  const base = 'inline-flex items-center px-2 py-0.5 text-xs font-bold border border-current'
  const map: Record<PrioridadOrden, string> = {
    alta:   `${base} bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300`,
    media:  `${base} bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300`,
    baja:   `${base} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400`,
  }
  return map[prioridad] ?? base
}

export function labelPrioridad(prioridad: PrioridadOrden): string {
  const map: Record<PrioridadOrden, string> = {
    alta:  'Alta',
    media: 'Media',
    baja:  'Baja',
  }
  return map[prioridad] ?? prioridad
}

export function chipEstadoMaquina(estado: EstadoMaquina): string {
  const base = 'inline-flex items-center px-2 py-0.5 text-xs font-bold border border-current'
  const map: Record<EstadoMaquina, string> = {
    activa:         `${base} bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300`,
    mantenimiento:  `${base} bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300`,
    inactiva:       `${base} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400`,
  }
  return map[estado] ?? base
}

export function labelEstadoMaquina(estado: EstadoMaquina): string {
  const map: Record<EstadoMaquina, string> = {
    activa:         'Activa',
    mantenimiento:  'En mantenimiento',
    inactiva:       'Inactiva',
  }
  return map[estado] ?? estado
}

export function colorProyeccion(estado: ProyeccionEstado): string {
  const map: Record<ProyeccionEstado, string> = {
    verde:    'text-green-700 dark:text-green-400',
    amarillo: 'text-yellow-700 dark:text-yellow-400',
    rojo:     'text-red-700 dark:text-red-400',
  }
  return map[estado]
}

export function iconoProyeccion(estado: ProyeccionEstado): string {
  return { verde: '✅', amarillo: '⚠️', rojo: '🔴' }[estado]
}

export function chipTipoAlerta(tipo: TipoAlerta): string {
  const base = 'inline-flex items-center px-2 py-0.5 text-xs font-bold border border-current'
  const map: Record<TipoAlerta, string> = {
    entrega_proxima:     `${base} bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300`,
    proyeccion_ajustada: `${base} bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300`,
    inventario_bajo:     `${base} bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300`,
  }
  return map[tipo] ?? base
}

export function labelTipoAlerta(tipo: TipoAlerta): string {
  const map: Record<TipoAlerta, string> = {
    entrega_proxima:     'Entrega próxima',
    proyeccion_ajustada: 'Proyección ajustada',
    inventario_bajo:     'Inventario bajo',
  }
  return map[tipo] ?? tipo
}

export function iconoTipoAlerta(tipo: TipoAlerta): string {
  const map: Record<TipoAlerta, string> = {
    entrega_proxima:     '📅',
    proyeccion_ajustada: '⚠️',
    inventario_bajo:     '📦',
  }
  return map[tipo] ?? '🔔'
}

// ── Sistema de clases brutalistas ────────────────────────────
//
// Convenciones:
//   • Sin border-radius (rounded-none en todo)
//   • Sombra offset sólida: shadow-[4px_4px_0px_#000]
//   • Hover: desplazamiento +1px, sombra reducida a 2px — sin transition
//   • Active/press: translate +3px, shadow-none (efecto "clic")
//   • Font-weight 700 en botones y labels
//   • Sin gradientes, colores planos

export const cls = {

  // Botón primario — azul sólido, sombra negra
  btnPrimary: [
    'inline-flex items-center gap-2 px-4 py-2',
    'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
    'text-white text-sm font-bold',
    'border-2 border-black dark:border-white',
    'shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_rgba(255,255,255,0.3)]',
    'hover:translate-x-[1px] hover:translate-y-[1px]',
    'hover:shadow-[2px_2px_0px_#000] dark:hover:shadow-[2px_2px_0px_rgba(255,255,255,0.3)]',
    'active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0',
  ].join(' '),

  // Botón secundario — blanco/gris, sombra negra
  btnSecondary: [
    'inline-flex items-center gap-2 px-4 py-2',
    'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700',
    'text-gray-900 dark:text-gray-100 text-sm font-bold',
    'border-2 border-black dark:border-gray-400',
    'shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_rgba(255,255,255,0.2)]',
    'hover:translate-x-[1px] hover:translate-y-[1px]',
    'hover:shadow-[2px_2px_0px_#000] dark:hover:shadow-[2px_2px_0px_rgba(255,255,255,0.2)]',
    'active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
  ].join(' '),

  // Botón peligro — rojo sólido, sombra negra
  btnDanger: [
    'inline-flex items-center gap-2 px-4 py-2',
    'bg-red-600 hover:bg-red-700 active:bg-red-800',
    'text-white text-sm font-bold',
    'border-2 border-black dark:border-white',
    'shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_rgba(255,255,255,0.3)]',
    'hover:translate-x-[1px] hover:translate-y-[1px]',
    'hover:shadow-[2px_2px_0px_#000] dark:hover:shadow-[2px_2px_0px_rgba(255,255,255,0.3)]',
    'active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
  ].join(' '),

  // Botón fantasma — sin fondo, hover con relleno brusco
  btnGhost: [
    'inline-flex items-center gap-2 px-3 py-1.5',
    'text-gray-700 dark:text-gray-200 text-sm font-bold',
    'hover:bg-gray-900 hover:text-white',
    'dark:hover:bg-white dark:hover:text-gray-900',
    'active:bg-black active:text-white dark:active:bg-gray-200 dark:active:text-gray-900',
  ].join(' '),

  // Input de texto — borde grueso, sin ring suave
  input: [
    'w-full px-3 py-2 text-sm',
    'bg-white dark:bg-gray-900',
    'border-2 border-black dark:border-gray-500',
    'text-gray-900 dark:text-gray-100',
    'placeholder-gray-400 dark:placeholder-gray-500',
    'focus:outline-none focus:border-blue-600 dark:focus:border-blue-400',
    'focus:ring-0',
    'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed',
  ].join(' '),

  // Select — mismo tratamiento que input
  select: [
    'w-full px-3 py-2 text-sm',
    'bg-white dark:bg-gray-900',
    'border-2 border-black dark:border-gray-500',
    'text-gray-900 dark:text-gray-100',
    'focus:outline-none focus:border-blue-600 dark:focus:border-blue-400',
    'focus:ring-0',
  ].join(' '),

  // Label — negrita, sin suavizado
  label: 'block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1',

  // Card — borde negro, sombra offset dura
  card: [
    'bg-white dark:bg-gray-900',
    'border-2 border-black dark:border-gray-600',
    'shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.12)]',
  ].join(' '),

  // Utilidades de layout (sin cambio estructural)
  pageHeader: 'flex items-center justify-between mb-6',
  pageTitle:  'text-xl font-black text-gray-900 dark:text-white tracking-tight',
  errorText:  'text-xs font-bold text-red-700 dark:text-red-400 mt-1',
}
