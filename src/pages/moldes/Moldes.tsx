import { useParams, useLocation } from 'react-router-dom'
import MoldesLista from './MoldesLista'
import MoldesFormulario from './MoldesFormulario'
import MoldesDetalle from './MoldesDetalle'

export default function Moldes() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const esNuevo = location.pathname.endsWith('/nuevo')

  if (esNuevo) return <MoldesFormulario />
  if (id)      return <MoldesDetalle id={id} />
  return <MoldesLista />
}
