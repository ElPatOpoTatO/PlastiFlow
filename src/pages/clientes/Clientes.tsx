import { useParams, useLocation } from 'react-router-dom'
import ClientesLista from './ClientesLista'
import ClientesFormulario from './ClientesFormulario'
import ClientesDetalle from './ClientesDetalle'

export default function Clientes() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const esNuevo = location.pathname.endsWith('/nuevo')

  if (esNuevo) return <ClientesFormulario />
  if (id)      return <ClientesDetalle id={id} />
  return <ClientesLista />
}
