import { useLocation, useNavigate } from 'react-router-dom'
import { Plus, LogOut, Menu } from 'lucide-react'
import { authService } from '../../services/authService'
import NotificationBell from './NotificationBell'

const PAGE_TITLES = {
  '/dashboard':     { title: 'Dashboard',     subtitle: 'Resumen general de la tienda'    },
  '/productos':     { title: 'Productos',     subtitle: 'Gestiona el catálogo de calzado' },
  '/categorias':    { title: 'Categorías',    subtitle: 'Organiza tus líneas de producto' },
  '/inventario':    { title: 'Inventario',    subtitle: 'Control de stock y existencias'  },
  '/pedidos':       { title: 'Pedidos',       subtitle: 'Gestiona los pedidos de clientes'},
  '/devoluciones':  { title: 'Devoluciones',  subtitle: 'Solicitudes de devolución de producto'},
  '/clientes':      { title: 'Clientes',      subtitle: 'Base de datos de compradores'   },
  '/promociones':   { title: 'Promociones',   subtitle: 'Cupones y descuentos activos'   },
  '/reportes':      { title: 'Reportes',      subtitle: 'Análisis y estadísticas de ventas'},
  '/configuracion': { title: 'Configuración', subtitle: 'Ajustes de la tienda'           },
}

const PAGE_ACTIONS = {
  '/promociones': { label: 'Nueva Promoción', path: null               },
}

export default function Header({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const user = authService.getUser()

  const handleLogout = async () => {
    await authService.logout()
    navigate('/login', { replace: true })
  }

  const pathname = '/' + location.pathname.split('/')[1]
  const pageInfo = PAGE_TITLES[pathname] ?? { title: 'Jey Avila Music', subtitle: '' }
  const action   = PAGE_ACTIONS[pathname]

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white border-b border-gray-100 z-20 flex items-center px-4 sm:px-6 gap-3">

      {/* Hamburger — solo mobile */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 hover:bg-gray-100 text-gray-500 hover:text-black transition-colors flex-shrink-0"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm sm:text-base font-bold text-black leading-none truncate">{pageInfo.title}</h1>
        {pageInfo.subtitle && (
          <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{pageInfo.subtitle}</p>
        )}
      </div>

      {/* Notifications */}
      <NotificationBell />

      {/* Action button */}
      {action && (
        <button
          onClick={() => action.path && navigate(action.path)}
          className="btn-primary hidden sm:flex flex-shrink-0"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">{action.label}</span>
        </button>
      )}

      {/* User + logout */}
      {user && (
        <div className="flex items-center gap-2 pl-2 border-l border-gray-100 flex-shrink-0">
          <div className="w-8 h-8 bg-black flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user.nombre?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>
          <span className="text-xs font-semibold text-black hidden lg:block">{user.nombre}</span>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      )}
    </header>
  )
}
