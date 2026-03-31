// ============================================================
// PlastiFlow — Configuración de Rutas
// ============================================================

import { createBrowserRouter } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/dashboard/Dashboard'
import Ordenes from './pages/ordenes/Ordenes'
import Maquinas from './pages/maquinas/Maquinas'
import Moldes from './pages/moldes/Moldes'
import Materiales from './pages/materiales/Materiales'
import Clientes from './pages/clientes/Clientes'
import Estadisticas from './pages/estadisticas/Estadisticas'
import Calendario from './pages/calendario/Calendario'
import Configuracion from './pages/configuracion/Configuracion'
import Alertas from './pages/alertas/Alertas'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true,            element: <Dashboard /> },
      { path: 'ordenes',        element: <Ordenes /> },
      { path: 'ordenes/nueva',  element: <Ordenes /> },
      { path: 'ordenes/:id',    element: <Ordenes /> },
      { path: 'maquinas',       element: <Maquinas /> },
      { path: 'maquinas/nueva', element: <Maquinas /> },
      { path: 'maquinas/:id',   element: <Maquinas /> },
      { path: 'moldes',         element: <Moldes /> },
      { path: 'moldes/nuevo',   element: <Moldes /> },
      { path: 'moldes/:id',     element: <Moldes /> },
      { path: 'materiales',     element: <Materiales /> },
      { path: 'materiales/nuevo', element: <Materiales /> },
      { path: 'materiales/:id', element: <Materiales /> },
      { path: 'clientes',       element: <Clientes /> },
      { path: 'clientes/nuevo', element: <Clientes /> },
      { path: 'clientes/:id',   element: <Clientes /> },
      { path: 'estadisticas',   element: <Estadisticas /> },
      { path: 'calendario',     element: <Calendario /> },
      { path: 'alertas',        element: <Alertas /> },
      { path: 'configuracion',  element: <Configuracion /> },
    ],
  },
])
