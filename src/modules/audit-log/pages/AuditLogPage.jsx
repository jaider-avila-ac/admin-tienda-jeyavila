import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { auditLogService } from '../../../services/auditLogService'
import { authService } from '../../../services/authService'
import EmptyState from '../../../components/ui/EmptyState'

const ACCION_LABEL = {
  'colaborador.creado': 'Creó al colaborador',
  'colaborador.editado': 'Editó al colaborador',
  'colaborador.activado': 'Activó al colaborador',
  'colaborador.desactivado': 'Desactivó al colaborador',
  'pedido.cambio_estado': 'Cambió el estado del pedido',
  'venta_local.creada': 'Registró una venta local',
}

function detalleTexto(item) {
  const d = item.detalle ?? {}
  if (item.accion === 'pedido.cambio_estado') {
    return `${d.estado_anterior ?? '?'} → ${d.estado_nuevo ?? '?'}`
  }
  if (item.accion === 'venta_local.creada') {
    return `Pedido #${d.numero ?? item.entidad_id} — ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(d.total ?? 0)}`
  }
  if (item.accion?.startsWith('colaborador.') && d.rol) {
    return `Rol: ${d.rol}${d.email ? ` · ${d.email}` : ''}`
  }
  return Object.keys(d).length > 0 ? Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(' · ') : '—'
}

export default function AuditLogPage() {
  const rol = authService.getUser()?.rol
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const load = (p) => {
    setLoading(true)
    auditLogService.list({ page: p, size: 20 })
      .then((data) => {
        setItems(Array.isArray(data?.content) ? data.content : [])
        setTotalPages(data?.total_pages ?? 0)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (rol === 'admin' || rol === 'superadmin') load(page)
    else setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  if (rol !== 'admin' && rol !== 'superadmin') {
    return (
      <div className="section-card">
        <EmptyState title="No tienes acceso a esta sección" description="Solo un administrador puede ver la auditoría." />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Auditoría</h1>
        <p className="page-subtitle">Registro de acciones sensibles realizadas por el equipo (quién hizo qué).</p>
      </div>

      <div className="section-card">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando…</div>
        ) : items.length === 0 ? (
          <EmptyState title="Sin registros" description="Todavía no hay acciones registradas." />
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header px-5 py-3 text-left">Fecha</th>
                  <th className="table-header px-4 py-3 text-left">Quién</th>
                  <th className="table-header px-4 py-3 text-left">Acción</th>
                  <th className="table-header px-4 py-3 text-left">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell px-5 text-gray-500 whitespace-nowrap">{item.creado_en}</td>
                    <td className="table-cell px-4">
                      <p className="font-semibold text-black text-sm">{item.admin_nombre}</p>
                      <p className="text-xs text-gray-400">{item.admin_email}</p>
                    </td>
                    <td className="table-cell px-4 text-sm text-black">
                      {ACCION_LABEL[item.accion] ?? item.accion}
                      {item.entidad === 'pedido' && (
                        <Link to={`/pedidos/${item.entidad_id}`} className="ml-1 text-xs text-admin-accent hover:underline">
                          Ver pedido
                        </Link>
                      )}
                    </td>
                    <td className="table-cell px-4 text-gray-500 text-xs">{detalleTexto(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 py-3 border-t border-gray-100">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                  className="p-1.5 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-gray-400">Página {page + 1} de {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="p-1.5 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
