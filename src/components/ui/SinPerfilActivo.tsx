import { Link } from 'react-router-dom'
import { cls } from '../../utils/ui'

export default function SinPerfilActivo() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="text-5xl mb-4">🏭</div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No hay perfil activo</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
        Selecciona o crea un perfil de fábrica para comenzar a gestionar datos.
      </p>
      <Link to="/configuracion" className={`${cls.btnPrimary} mt-5`}>
        Ir a Configuración
      </Link>
    </div>
  )
}
