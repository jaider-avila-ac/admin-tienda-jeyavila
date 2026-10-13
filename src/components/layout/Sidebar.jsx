import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, Tag, ShoppingBag,
  Users, Ticket, BarChart2, Settings, ChevronDown,
  Warehouse, X,
} from 'lucide-react'
import { authService } from '../../services/authService'

const NAV = [
  {
    group: 'Principal',
    icon: LayoutDashboard,
    items: [{ label: 'Dashboard', path: '/dashboard' }],
  },
  {
    group: 'Tienda',
    icon: Package,
    items: [
      { label: 'Categorías',  path: '/categorias'  },
      { label: 'Colecciones', path: '/colecciones' },
      { label: 'Productos',   path: '/productos'   },
      { label: 'Inventario',  path: '/inventario'  },
    ],
  },
  {
    group: 'Ventas',
    icon: ShoppingBag,
    items: [
      { label: 'Pedidos',      path: '/pedidos'      },
      { label: 'Devoluciones', path: '/devoluciones' },
      { label: 'Preguntas',    path: '/preguntas'    },
      { label: 'Venta local',  path: '/venta-local'  },
      { label: 'Clientes',    path: '/clientes'    },
    ],
  },
  {
    group: 'Análisis',
    icon: BarChart2,
    items: [
      { label: 'Reportes', path: '/reportes', roles: ['admin', 'superadmin'] },
      { label: 'Analítica', path: '/analitica', roles: ['admin', 'superadmin'] },
    ],
  },
  {
    group: 'Sistema',
    icon: Settings,
    items: [
      { label: 'Banners',       path: '/banners'       },
      { label: 'Colaboradores', path: '/colaboradores', roles: ['admin', 'superadmin'] },
      { label: 'Auditoría', path: '/auditoria', roles: ['admin', 'superadmin'] },
      { label: 'Configuración', path: '/configuracion' },
    ],
  },
]

export default function Sidebar({ open, onClose }) {
  const location  = useLocation()
  const user      = authService.getUser()

  const [expanded, setExpanded] = useState(() =>
    Object.fromEntries(NAV.map((s) => [s.group, true]))
  )

  const toggle = (group) =>
    setExpanded((prev) => ({ ...prev, [group]: !prev[group] }))

  const visibleItems = (section) =>
    section.items.filter((item) => !item.roles || item.roles.includes(user?.rol))

  const isGroupActive = (section) =>
    visibleItems(section).some((item) => location.pathname.startsWith(item.path))

  return (
    <>
      {/* Backdrop móvil */}
      <div
        className={`fixed inset-0 bg-black/60 z-30 lg:hidden transition-opacity duration-300
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-[#0d0d0d] flex flex-col z-40
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* ── Logo ── */}
        <div className="px-4 py-5 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
          <Link to="/dashboard" onClick={onClose}>
            <img src="/logos/logo-blanco.png" alt="Jey Avila Music" width="800" height="334" className="h-10 w-auto" />
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-gray-600 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Navegación ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-[2px]
          [&::-webkit-scrollbar]:w-[3px]
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-white/10">

          {NAV.map((section) => {
            if (visibleItems(section).length === 0) return null

            const Icon    = section.icon
            const isOpen  = expanded[section.group]
            const hasActive = isGroupActive(section)

            return (
              <div key={section.group}>
                {/* Cabecera del grupo — actúa como carpeta */}
                <button
                  onClick={() => toggle(section.group)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-semibold transition-all duration-150 group
                    ${hasActive
                      ? 'bg-admin-accent text-admin-accent-contrast'
                      : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'}`}
                >
                  <Icon size={15} strokeWidth={2} className="flex-shrink-0" />
                  <span className="flex-1 text-left">{section.group}</span>

                  {/* Dot si está colapsado y tiene hijo activo */}
                  {!isOpen && hasActive && (
                    <span className="w-1.5 h-1.5 bg-admin-accent-contrast flex-shrink-0" />
                  )}

                  <ChevronDown
                    size={13}
                    className={`flex-shrink-0 transition-transform duration-200
                      ${isOpen ? 'rotate-180' : ''}
                      ${hasActive ? 'text-white/70' : 'text-gray-700 group-hover:text-gray-400'}`}
                  />
                </button>

                {/* Sub-items — estilo árbol de archivos */}
                {isOpen && (
                  <div className="mt-[2px] ml-[18px] pl-3 border-l border-white/[0.07]">
                    {visibleItems(section).map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-[7px] my-[1px] text-[12.5px] font-medium transition-all duration-150
                          ${isActive
                            ? 'bg-admin-accent-soft text-admin-accent'
                            : 'text-gray-500 hover:bg-white/[0.05] hover:text-gray-200'}`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className={`w-[5px] h-[5px] flex-shrink-0 transition-colors
                                ${isActive ? 'bg-admin-accent' : 'bg-gray-700'}`}
                            />
                            {item.label}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* ── Footer con usuario ── */}
        <div className="p-3 border-t border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.05] transition-colors cursor-default">
            <div className="w-8 h-8 bg-admin-accent flex items-center justify-center text-admin-accent-contrast text-xs font-black flex-shrink-0">
              {user?.nombre?.charAt(0)?.toUpperCase() ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate leading-none mb-0.5">
                {user?.nombre ?? 'Admin'}
              </p>
              <p className="text-gray-600 text-[11px] truncate">
                {user?.email ?? ''}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
