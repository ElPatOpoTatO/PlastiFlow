import { useParams, useLocation } from 'react-router-dom'
import MaterialesLista from './MaterialesLista'
import MaterialesFormulario from './MaterialesFormulario'
import MaterialesDetalle from './MaterialesDetalle'

export default function Materiales() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const esNuevo = location.pathname.endsWith('/nuevo')

  if (esNuevo) return <MaterialesFormulario />
  if (id)      return <MaterialesDetalle id={id} />
  return <MaterialesLista />
}
