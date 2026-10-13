import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Search, Trash2 } from 'lucide-react'
import { useCustomers } from '../hooks/useCustomers'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import { formatCurrency, formatDate } from '../../../utils/format'

const PROVIDER_LABEL = { EMAIL: 'Email', GOOGLE: 'Google' }

function customerName(c) {
  return `${c.nombre ?? ''} ${c.apellido ?? ''}`.trim() || c.email || 'Cliente'
}

export default function CustomersPage() {
  const { customers, loading, error, remove } = useCustomers()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const filtered = customers.filter((c) => {
    const query = search.toLowerCase()
    const fullname = customerName(c).toLowerCase()
    const email = c.email ?? ''
    const matchSearch =
      fullname.includes(query) ||
      email.toLowerCase().includes(query) ||
      (c.ciudad ?? '').toLowerCase().includes(query) ||
      (c.numero_documento ?? '').includes(search)
    const matchStatus = filterStatus === '' ? true : filterStatus === 'activo' ? c.activo : !c.activo
    return matchSearch && matchStatus
  })

  const handleDelete = (c) => {
    if (confirm(`¿Desactivar al cliente "${customerName(c)}"?`)) remove(c.id)
  }

  return (
    <div className="space-y-4">
      <div className="section-card px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Buscar por nombre, email, ciudad o documento..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 input-field text-sm" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field w-auto text-sm">
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </div>

      <div className="section-card">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
        ) : error ? (
          <EmptyState title="No se pudieron cargar los clientes" description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState title="Sin clientes" description="No se encontraron clientes." />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header px-5 py-3 text-left">Cliente</th>
                <th className="table-header px-4 py-3 text-center">Pedidos</th>
                <th className="table-header px-4 py-3 text-right">Total gastado</th>
                <th className="table-header px-4 py-3 text-left">Registro</th>
                <th className="table-header px-4 py-3 text-center">Estado</th>
                <th className="table-header px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-violet-950 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {customerName(c).charAt(0)}
                      </div>
                      <div>
                        <span className="font-semibold text-black text-sm">{customerName(c)}</span>
                        <p className="text-xs text-gray-400">{PROVIDER_LABEL[c.provider] ?? c.provider ?? 'Email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell px-4 text-center font-bold text-black">{c.total_pedidos ?? 0}</td>
                  <td className="table-cell px-4 text-right font-bold text-black">{formatCurrency(c.total_gastado ?? 0)}</td>
                  <td className="table-cell px-4 text-gray-500">{formatDate(c.creado_en)}</td>
                  <td className="table-cell px-4 text-center">
                    <Badge variant={c.activo ? 'success' : 'danger'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge>
                  </td>
                  <td className="table-cell px-4">
                    <div className="flex items-center justify-center gap-1">
                      <Link to={`/clientes/${c.id}`} className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-black transition-colors" title="Ver cliente">
                        <Eye size={14} />
                      </Link>
                      <button onClick={() => handleDelete(c)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Desactivar cliente">
                        <Trash2 size={14} />
                      </button>
                    </div>
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
