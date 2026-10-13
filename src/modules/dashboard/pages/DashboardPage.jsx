import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Users, Package, DollarSign, AlertTriangle, ArrowRight, TrendingUp, Clock } from 'lucide-react'
import { reportService } from '../../../services/reportService'
import { orderService } from '../../../services/orderService'
import { api } from '../../../services/api'
import { authService } from '../../../services/authService'
import StatCard from '../../../components/ui/StatCard'
import Badge from '../../../components/ui/Badge'
import { formatCurrency, formatDate } from '../../../utils/format'

const BADGE_MAP = {
  pendiente_pago: 'warning', pagado: 'info', preparando: 'dark',
  enviado: 'dark', entregado: 'success', cancelado: 'danger', devuelto: 'default',
}
const ESTADO_LABEL = {
  pendiente_pago: 'Pago en proceso', pagado: 'Pagado', preparando: 'Preparando',
  enviado: 'Enviado', entregado: 'Entregado', cancelado: 'Cancelado', devuelto: 'Devuelto',
}

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function DashboardPage() {
  const [resumen,       setResumen]       = useState(null)
  const [recentOrders,  setRecentOrders]  = useState([])
  const [lowStock,      setLowStock]      = useState([])
  const [byEstado,      setByEstado]      = useState([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    const mes = currentMonth()
    // allSettled: cada tarjeta se llena de forma independiente — si alguna petición falla
    // (ej. un colaborador con acceso restringido a algo puntual), el resto del dashboard
    // igual debe cargar en vez de quedar todo vacío.
    Promise.allSettled([
      reportService.resumen(mes),
      orderService.getAll(),
      reportService.pedidosPorEstado(mes),
      api.get('/variantes/low-stock?limite=10'),
    ])
      .then(([res, orders, estados, stock]) => {
        if (res.status === 'fulfilled') setResumen(res.value)
        if (orders.status === 'fulfilled') setRecentOrders((Array.isArray(orders.value) ? orders.value : []).slice(0, 6))
        if (estados.status === 'fulfilled') setByEstado(Array.isArray(estados.value) ? estados.value : [])
        if (stock.status === 'fulfilled') setLowStock(Array.isArray(stock.value) ? stock.value : [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="py-20 text-center text-sm text-gray-400">Cargando dashboard…</div>
  }

  const pendingCount = resumen?.pedidos_en_proceso ?? 0
  // Un colaborador ve ingresos/pedidos por estado escalados a lo suyo (ver ReporteService.
  // resumen — ya no se ocultan, se fuerzan al propio colaborador), nunca a la tienda completa —
  // las etiquetas lo dejan claro para que no se lea como si fuera el total del negocio.
  const esAdmin = ['admin', 'superadmin'].includes(authService.getUser()?.rol)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className={`grid grid-cols-2 gap-4 ${resumen?.total_ingresos != null ? 'lg:grid-cols-5' : 'lg:grid-cols-3'}`}>
        {resumen?.total_ingresos != null && (
          <StatCard
            title={esAdmin ? 'Ingresos del mes' : 'Mis ingresos del mes'}
            value={formatCurrency(resumen.total_ingresos)}
            subtitle={esAdmin ? 'Pedidos entregados' : 'De tus pedidos gestionados'}
            icon={DollarSign}
            to={esAdmin ? '/reportes' : undefined}
          />
        )}
        {resumen?.ingresos_pendientes != null && (
          <StatCard
            title="Pendiente por preparar"
            value={formatCurrency(resumen.ingresos_pendientes)}
            subtitle="Ya pagado, aún no cuenta como ingreso"
            icon={Clock}
            to="/pedidos?estado=pagado"
          />
        )}
        <StatCard
          title={esAdmin ? 'Pedidos del mes' : 'Mis pedidos del mes'}
          value={resumen?.total_pedidos ?? 0}
          subtitle={`${pendingCount} en proceso`}
          icon={ShoppingBag}
          to="/pedidos"
        />
        <StatCard
          title="Clientes nuevos"
          value={resumen?.total_clientes ?? 0}
          subtitle="Registrados este mes"
          icon={Users}
          to="/clientes"
        />
        <StatCard
          title="Productos"
          value={resumen?.total_productos ?? 0}
          subtitle={`${resumen?.productos_activos ?? 0} activos`}
          icon={Package}
          to="/productos"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pedidos recientes */}
        <div className="lg:col-span-2 section-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-black">Pedidos recientes</h2>
            <Link to="/pedidos" className="text-xs text-gray-400 hover:text-black flex items-center gap-1 transition-colors">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">Sin pedidos aún</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <ShoppingBag size={18} className="text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black truncate">{order.numero} — {order.cliente_nombre}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.creado_en)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-black">{formatCurrency(order.total)}</p>
                    <Badge variant={BADGE_MAP[order.estado]} className="mt-0.5">{ESTADO_LABEL[order.estado]}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock bajo */}
        <div className="section-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-black">Stock bajo</h2>
            <Link to="/inventario" className="text-xs text-gray-400 hover:text-black flex items-center gap-1 transition-colors">
              Ver todo <ArrowRight size={12} />
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400">Todo el inventario en orden</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {lowStock.map((v) => (
                <div key={v.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`w-2 h-2 flex-shrink-0 ${v.estado_stock === 'agotado' ? 'bg-red-600' : 'bg-yellow-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-black truncate">{v.producto_nombre ?? v.nombre}</p>
                    <p className="text-xs text-gray-400">{v.talla ?? ''}{v.color ? ` · ${v.color}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {v.estado_stock === 'agotado' && <AlertTriangle size={12} className="text-red-500" />}
                    <span className={`text-xs font-bold ${v.estado_stock === 'agotado' ? 'text-red-600' : 'text-yellow-600'}`}>
                      {v.stock} uds
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pedidos por estado */}
      <div className="section-card">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-black">{esAdmin ? 'Pedidos por estado' : 'Mis pedidos por estado'}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-50">
          {/* "pagado" no se muestra: es un estado de tránsito tan corto (todo pedido pasa
              directo a "preparando" al confirmarse) que casi siempre está en 0 — mismo motivo
              por el que se quitó de los filtros de Pedidos (ver ESTADOS_FILTRO_PEDIDOS). En su
              lugar se muestra "pendiente_pago", que sí es información útil (pedidos esperando
              confirmación de pago). */}
          {['pendiente_pago', 'preparando', 'enviado', 'entregado'].map((estado) => {
            const found = byEstado.find((e) => e.estado === estado)
            return (
              <Link key={estado} to={`/pedidos?estado=${estado}`} className="px-5 py-4 text-center block hover:bg-gray-50 transition-colors">
                <Badge variant={BADGE_MAP[estado]}>{ESTADO_LABEL[estado]}</Badge>
                <p className="text-2xl font-black text-black mt-2">{found?.cantidad ?? 0}</p>
                {found?.total != null && (
                  <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(found.total)}</p>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
