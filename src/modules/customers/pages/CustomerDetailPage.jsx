import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, IdCard, Mail, MapPin, Phone, User } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import { customerService } from '../../../services/customerService'
import { formatCurrency, formatDate } from '../../../utils/format'

const PROVIDER_LABEL = { EMAIL: 'Email', GOOGLE: 'Google' }

function valueOrDash(value) {
  return value || '-'
}

function customerName(customer) {
  return `${customer?.nombre ?? ''} ${customer?.apellido ?? ''}`.trim() || customer?.email || 'Cliente'
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="min-h-10 flex items-center border border-gray-100 bg-gray-50 px-3 text-sm font-semibold text-black">
        {valueOrDash(value)}
      </p>
    </div>
  )
}

export default function CustomerDetailPage() {
  const { id } = useParams()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCustomer(await customerService.getById(id))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
  }

  if (error) {
    return <EmptyState title="No se pudo cargar el cliente" description={error} />
  }

  const direcciones = Array.isArray(customer?.direcciones) ? customer.direcciones : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link to="/clientes" className="btn-secondary">
          <ArrowLeft size={15} />
          Volver
        </Link>
        <Badge variant={customer?.activo ? 'success' : 'danger'}>{customer?.activo ? 'Activo' : 'Inactivo'}</Badge>
      </div>

      <div className="section-card px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-violet-950 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {customerName(customer).charAt(0)}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-black text-black truncate">{customerName(customer)}</h2>
            <p className="text-xs text-gray-400">{PROVIDER_LABEL[customer?.provider] ?? customer?.provider ?? 'Email'} · Registro {formatDate(customer?.creado_en)}</p>
          </div>
        </div>
      </div>

      <div className="section-card p-5">
        <div className="flex items-center gap-2 mb-5">
          <User size={16} className="text-gray-400" />
          <h2 className="text-sm font-bold text-black">Información personal</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nombre" value={customer?.nombre} />
          <Field label="Apellido" value={customer?.apellido} />
          <Field label="Correo electrónico" value={customer?.email} />
          <Field label="Teléfono / Celular" value={customer?.telefono} />
          <Field label="Tipo de documento" value={customer?.tipo_documento} />
          <Field label="Número de documento" value={customer?.numero_documento} />
        </div>
      </div>

      <div className="section-card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 border border-gray-100 bg-gray-50 px-4 py-3">
            <Mail size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Pedidos</p>
              <p className="text-sm font-black text-black">{customer?.total_pedidos ?? 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border border-gray-100 bg-gray-50 px-4 py-3">
            <IdCard size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Total gastado</p>
              <p className="text-sm font-black text-black">{formatCurrency(customer?.total_gastado ?? 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="section-card p-5">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-gray-400" />
            <h2 className="text-sm font-bold text-black">Direcciones de envío</h2>
          </div>
          <span className="text-xs font-bold text-gray-400">{direcciones.length}</span>
        </div>

        {direcciones.length === 0 ? (
          <p className="text-sm text-gray-400">Este cliente aún no tiene direcciones registradas en pedidos.</p>
        ) : (
          <div className="space-y-3">
            {direcciones.map((d, index) => (
              <div key={d.id ?? index} className="border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Dirección {index + 1}</p>
                    <p className="text-sm font-black text-black mt-1">{valueOrDash(d.direccion)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Dirección o lugar de entrega" value={d.direccion} />
                  <Field label="Complemento" value={d.complemento} />
                  <Field label="Departamento" value={d.departamento} />
                  <Field label="Municipio / Localidad" value={d.municipio} />
                  <Field label="Barrio" value={d.barrio} />
                  <Field label="Apartamento / Casa" value={d.apartamento} />
                </div>

                <div className="border-t border-gray-200 mt-4 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Phone size={14} className="text-gray-400" />
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Datos de contacto</p>
                      <p className="text-xs text-gray-400">Contacto usado para la entrega.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Nombre y apellido" value={d.contacto_nombre} />
                    <Field label="Teléfono" value={d.contacto_telefono} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
