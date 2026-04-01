// ============================================================
// PlastiFlow — Base de Datos IndexedDB con Dexie.js
// ============================================================

import Dexie, { type Table } from 'dexie'
import type { Perfil, Maquina, Molde, Cliente, Material, OrdenProduccion, Alerta, RegistroDiario } from '../types'

class PlastiFlowDB extends Dexie {
  perfiles!: Table<Perfil, string>
  maquinas!: Table<Maquina, string>
  moldes!: Table<Molde, string>
  clientes!: Table<Cliente, string>
  materiales!: Table<Material, string>
  ordenes!: Table<OrdenProduccion, string>
  alertas!: Table<Alerta, string>
  registrosDiarios!: Table<RegistroDiario, string>

  constructor() {
    super('PlastiFlowDB')
    this.version(1).stores({
      perfiles: 'id, nombre',
      maquinas: 'id, perfilId, nombre, identificador, estado',
      moldes: 'id, perfilId, nombre, identificador',
      clientes: 'id, perfilId, nombre, identificador',
      materiales: 'id, perfilId, nombre, identificador',
      ordenes: 'id, perfilId, folio, clienteId, moldeId, maquinaId, materialId, estado, prioridad, fechaEntrega',
      alertas: 'id, perfilId, tipo, ordenId, materialId, vista',
    })
    this.version(2).stores({
      perfiles: 'id, nombre',
      maquinas: 'id, perfilId, nombre, identificador, estado',
      moldes: 'id, perfilId, nombre, identificador',
      clientes: 'id, perfilId, nombre, identificador',
      materiales: 'id, perfilId, nombre, identificador',
      ordenes: 'id, perfilId, folio, clienteId, moldeId, maquinaId, materialId, estado, prioridad, fechaEntrega',
      alertas: 'id, perfilId, tipo, ordenId, materialId, vista',
      registrosDiarios: 'id, ordenId, fecha, perfilId, [ordenId+fecha]',
    })
  }
}

export const db = new PlastiFlowDB()
