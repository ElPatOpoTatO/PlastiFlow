import { useParams, useLocation } from 'react-router-dom'
import MaquinasLista from './MaquinasLista'
import MaquinasFormulario from './MaquinasFormulario'
import MaquinasDetalle from './MaquinasDetalle'

export default function Maquinas() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const esNuevo = location.pathname.endsWith('/nueva')

  if (esNuevo) return <MaquinasFormulario />
  if (id)      return <MaquinasDetalle id={id} />
  return <MaquinasLista />
}
