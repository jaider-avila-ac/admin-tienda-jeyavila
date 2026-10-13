import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, Search, AlertTriangle, UserPlus } from 'lucide-react'
import { useOrders } from '../hooks/useOrders'
import { orderService, ESTADOS_FILTRO_PEDIDOS, METODO_PAGO_LABEL } from '../../../services/orderService'
import { sucursalService } from '../../../services/sucursalService'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import { formatCurrency, formatDate } from '../../../utils/format'

const ESTADOS = ESTADOS_FILTRO_PEDIDOS
const BADGE_MAP = {
  pendiente_pago: 'warning',
  pagado:         'info',
  preparando:     'dark',
  enviado:        'dark',
  entregado:      'success',
  cancelado:      'danger',
  devuelto:       'default',
}

const ESTADO_LABEL = {
  pendiente_pago: 'Pago en proceso',
  pagado:         'Pagado',
  preparando:     'Preparando',
  enviado:        'Enviado',
  entregado:      'Entregado',
  cancelado:      'Cancelado',
  devuelto:       'Devuelto',
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { orders, counts, loading, reload } = useOrders()
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState(() => searchParams.get('estado') ?? '')
  const [filterColaborador, setFilterColaborador] = useState('')
  const [filterSucursal, setFilterSucursal] = useState('')
  const [colaboradores, setColaboradores] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [tomando, setTomando] = useState(null)

  useEffect(() => {
    orderService.getColaboradores().then((d) => setColaboradores(Array.isArray(d) ? d : [])).catch(() => {})
    sucursalService.list().then((d) => setSucursales(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  const handleTomar = async (id) => {
    setTomando(id)
    try {
      await orderService.asignarme(id)
      await reload()
    } catch (err) {
      alert(err.message || 'No se pudo tomar el pedido')
    } finally {
      setTomando(null)
    }
  }

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      o.numero?.toLowerCase().includes(q) ||
      String(o.id).includes(q) ||
      o.cliente_nombre?.toLowerCase().includes(q) ||
      o.cliente_email?.toLowerCase().includes(q)
    const matchEstado = filterEstado ? o.estado === filterEstado : true
    const matchColaborador = filterColaborador ? String(o.colaborador_id) === filterColaborador : true
    const matchSucursal = filterSucursal ? String(o.sucursal_id) === filterSucursal : true
    return matchSearch && matchEstado && matchColaborador && matchSucursal
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="section-card px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Buscar por #pedido o cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 input-field text-sm" />
          </div>
          <select value={filterSucursal} onChange={(e) => setFilterSucursal(e.target.value)}
            className="input-field bg-white text-sm w-40">
            <option value="">Todas las tiendas</option>
            {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
          <select value={filterColaborador} onChange={(e) => setFilterColaborador(e.target.value)}
            className="input-field bg-white text-sm w-48">
            <option value="">Todos los responsables</option>
            <option value="null">Sin asignar</option>
            {colaboradores.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setFilterEstado('')} className={`px-3 py-1.5 text-xs font-medium transition-all ${filterEstado === '' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Todos ({counts.total ?? 0})
            </button>
            {ESTADOS.map((e) => (
              <button key={e} onClick={() => setFilterEstado(e)} className={`px-3 py-1.5 text-xs font-medium transition-all ${filterEstado === e ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {ESTADO_LABEL[e]} ({counts[e] ?? 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="section-card">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Sin pedidos" description="No se encontraron pedidos con ese filtro." />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header px-5 py-3 text-left">#Pedido</th>
                <th className="table-header px-4 py-3 text-left">Cliente</th>
                <th className="table-header px-4 py-3 text-left">Fecha</th>
                <th className="table-header px-4 py-3 text-left">Método pago</th>
                <th className="table-header px-4 py-3 text-right">Total</th>
                <th className="table-header px-4 py-3 text-center">Estado</th>
                <th className="table-header px-4 py-3 text-left">Responsable</th>
                <th className="table-header px-4 py-3 text-left">Tienda</th>
                <th className="table-header px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell px-5">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-black">{order.numero}</p>
                      {order.alerta_stock && (
                        <AlertTriangle size={13} className="text-red-500 flex-shrink-0" title="Faltante de stock sin resolver" />
                      )}
                    </div>
                    {order.canal === 'local' && (
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Mostrador</span>
                    )}
                  </td>
                  <td className="table-cell px-4">
                    <div>
                      <p className="font-semibold text-black text-sm">{order.cliente_nombre}</p>
                      <p className="text-xs text-gray-400 truncate max-w-xs">{order.dir_snapshot?.municipio}</p>
                    </div>
                  </td>
                  <td className="table-cell px-4 text-gray-500">{formatDate(order.creado_en)}</td>
                  <td className="table-cell px-4 text-gray-500">
                    {order.metodo_pago ? (METODO_PAGO_LABEL[order.metodo_pago] ?? order.metodo_pago) : '—'}
                  </td>
                  <td className="table-cell px-4 text-right font-bold text-black">{formatCurrency(order.total)}</td>
                  <td className="table-cell px-4 text-center">
                    <Badge variant={BADGE_MAP[order.estado]}>{ESTADO_LABEL[order.estado]}</Badge>
                  </td>
                  <td className="table-cell px-4">
                    {order.colaborador_nombre ? (
                      <span className="text-xs font-semibold text-black">{order.colaborador_nombre}</span>
                    ) : (
                      <button onClick={() => handleTomar(order.id)} disabled={tomando === order.id}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-black transition-colors disabled:opacity-50">
                        <UserPlus size={13} /> {tomando === order.id ? 'Tomando...' : 'Tomar pedido'}
                      </button>
                    )}
                  </td>
                  <td className="table-cell px-4 text-gray-500 text-xs">{order.sucursal_nombre ?? '—'}</td>
                  <td className="table-cell px-4 text-center">
                    <button onClick={() => navigate(`/pedidos/${order.id}`)} className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-black transition-colors" title="Ver detalle">
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
