import { useParams, useLocation } from 'react-router-dom'
import OrdenesLista from './OrdenesLista'
import OrdenesFormulario from './OrdenesFormulario'
import OrdenesDetalle from './OrdenesDetalle'

export default function Ordenes() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const esNuevo = location.pathname.endsWith('/nueva')

  if (esNuevo) return <OrdenesFormulario />
  if (id) return <OrdenesDetalle id={id} />
  return <OrdenesLista />
}
