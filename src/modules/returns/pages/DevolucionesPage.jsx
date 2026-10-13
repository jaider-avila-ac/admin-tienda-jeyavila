import { useEffect, useState } from 'react'
import { Eye, PackageX } from 'lucide-react'
import { devolucionService, ESTADOS_DEVOLUCION } from '../../../services/devolucionService'
import { direccionDevolucionService } from '../../../services/direccionDevolucionService'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import Modal from '../../../components/ui/Modal'
import { formatCurrency, formatDate } from '../../../utils/format'

const BADGE_MAP = {
  pendiente: 'warning',
  aprobada: 'info',
  rechazada: 'danger',
  en_transito: 'dark',
  recibida: 'success',
  cancelada: 'default',
}

const ESTADO_LABEL = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  en_transito: 'En tránsito',
  recibida: 'Recibida',
  cancelada: 'Cancelada',
}

const TIPO_LABEL = {
  retracto: 'Retracto (cambió de opinión)',
  defecto: 'Defecto de fábrica',
}
const TIPO_BADGE = { retracto: 'default', defecto: 'warning' }

export default function DevolucionesPage() {
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterEstado, setFilterEstado] = useState('')
  const [seleccionada, setSeleccionada] = useState(null)
  const [direcciones, setDirecciones] = useState([])

  const load = () => {
    setLoading(true)
    devolucionService.getAll(filterEstado || undefined)
      .then((data) => setSolicitudes(Array.isArray(data) ? data : []))
      .catch(() => setSolicitudes([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [filterEstado])
  useEffect(() => {
    direccionDevolucionService.getAll().then((data) => setDirecciones(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  const abrirDetalle = (s) => setSeleccionada(s)
  const cerrarDetalle = () => setSeleccionada(null)

  const recargarYCerrar = () => { load(); cerrarDetalle() }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Devoluciones</h1>
        <p className="page-subtitle">Solicitudes de devolución de producto hechas por clientes.</p>
      </div>

      <div className="section-card px-5 py-4">
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilterEstado('')} className={`px-3 py-1.5 text-xs font-medium transition-all ${filterEstado === '' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Todas
          </button>
          {ESTADOS_DEVOLUCION.map((e) => (
            <button key={e} onClick={() => setFilterEstado(e)} className={`px-3 py-1.5 text-xs font-medium transition-all ${filterEstado === e ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {ESTADO_LABEL[e]}
            </button>
          ))}
        </div>
      </div>

      <div className="section-card">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
        ) : solicitudes.length === 0 ? (
          <EmptyState title="Sin solicitudes" description="No hay solicitudes de devolución con ese filtro." />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header px-5 py-3 text-left">#Pedido</th>
                <th className="table-header px-4 py-3 text-left">Tipo</th>
                <th className="table-header px-4 py-3 text-left">Motivo</th>
                <th className="table-header px-4 py-3 text-left">Fecha</th>
                <th className="table-header px-4 py-3 text-center">Estado</th>
                <th className="table-header px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {solicitudes.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell px-5 font-bold text-black">{s.numero_pedido}</td>
                  <td className="table-cell px-4">
                    <Badge variant={TIPO_BADGE[s.tipo]}>{TIPO_LABEL[s.tipo] || s.tipo}</Badge>
                  </td>
                  <td className="table-cell px-4 max-w-xs truncate">{s.motivo}</td>
                  <td className="table-cell px-4 text-gray-500">{formatDate(s.creado_en)}</td>
                  <td className="table-cell px-4 text-center">
                    <Badge variant={BADGE_MAP[s.estado]}>{ESTADO_LABEL[s.estado]}</Badge>
                  </td>
                  <td className="table-cell px-4 text-center">
                    <button onClick={() => abrirDetalle(s)} className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-black transition-colors" title="Ver detalle">
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!seleccionada} onClose={cerrarDetalle} title={seleccionada ? `Devolución — ${seleccionada.numero_pedido}` : ''} size="lg">
        {seleccionada && (
          <DetalleDevolucion
            solicitud={seleccionada}
            direcciones={direcciones.filter((d) => d.activo)}
            onCambiado={recargarYCerrar}
          />
        )}
      </Modal>
    </div>
  )
}

function DetalleDevolucion({ solicitud, direcciones, onCambiado }) {
  const [direccionId, setDireccionId] = useState('')
  const [notaAprobar, setNotaAprobar] = useState('')
  const [nota, setNota] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAprobar = async () => {
    if (!direccionId) { setError('Selecciona una dirección de devolución'); return }
    setLoading(true)
    setError('')
    try {
      await devolucionService.aprobar(solicitud.id, Number(direccionId), notaAprobar.trim() || null)
      onCambiado()
    } catch (err) {
      setError(err.message || 'No se pudo aprobar')
      setLoading(false)
    }
  }

  const handleRechazar = async () => {
    if (!nota.trim()) { setError('Indica el motivo del rechazo'); return }
    setLoading(true)
    setError('')
    try {
      await devolucionService.rechazar(solicitud.id, nota.trim())
      onCambiado()
    } catch (err) {
      setError(err.message || 'No se pudo rechazar')
      setLoading(false)
    }
  }

  const handleConfirmarRecibida = async () => {
    setLoading(true)
    setError('')
    try {
      await devolucionService.confirmarRecibida(solicitud.id)
      onCambiado()
    } catch (err) {
      setError(err.message || 'No se pudo confirmar')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Tipo de solicitud</p>
        <Badge variant={TIPO_BADGE[solicitud.tipo]}>{TIPO_LABEL[solicitud.tipo] || solicitud.tipo}</Badge>
        {solicitud.tipo === 'retracto' && (
          <p className="text-xs text-gray-400 mt-1.5">
            Derecho de retracto: solo procede dentro de los 5 días hábiles desde la entrega. El
            backend ya validó el plazo al crear la solicitud — no hace falta revisarlo de nuevo.
          </p>
        )}
        {solicitud.tipo === 'defecto' && (
          <p className="text-xs text-gray-400 mt-1.5">
            Defecto de fábrica: revisa las fotos y confirma que la falla no es por mal uso antes
            de aprobar.
          </p>
        )}
      </div>

      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Motivo del cliente</p>
        <p className="text-sm text-black bg-gray-50 p-3">{solicitud.motivo}</p>
      </div>

      {solicitud.fotos?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Fotos de evidencia</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {solicitud.fotos.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden bg-gray-100">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      {solicitud.direccion && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Dirección asignada</p>
          <p className="text-sm text-black">{solicitud.direccion.nombre} — {solicitud.direccion.direccion}, {solicitud.direccion.municipio}</p>
        </div>
      )}

      {solicitud.codigo_rastreo && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Guía de envío del cliente</p>
          <p className="text-sm text-black">{solicitud.codigo_rastreo}</p>
        </div>
      )}

      {solicitud.admin_nota && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nota del admin</p>
          <p className="text-sm text-black">{solicitud.admin_nota}</p>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {solicitud.estado === 'pendiente' && (
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div>
            <label className="label-field">Aprobar — dirección a la que debe enviar</label>
            <select value={direccionId} onChange={(e) => setDireccionId(e.target.value)} className="input-field bg-white">
              <option value="">Selecciona una dirección...</option>
              {direcciones.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Nota para el cliente (opcional)</label>
            <textarea value={notaAprobar} onChange={(e) => setNotaAprobar(e.target.value)} rows={2}
              className="input-field bg-white resize-none" placeholder="Instrucciones adicionales para el envío..." />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAprobar} disabled={loading} className="btn-primary text-xs">
              {loading ? 'Procesando...' : 'Aprobar devolución'}
            </button>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <label className="label-field">O rechazar — motivo</label>
            <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2}
              className="input-field bg-white resize-none" placeholder="Explica por qué se rechaza..." />
            <button onClick={handleRechazar} disabled={loading} className="btn-danger text-xs mt-2">
              <PackageX size={13} /> {loading ? 'Procesando...' : 'Rechazar solicitud'}
            </button>
          </div>
        </div>
      )}

      {solicitud.estado === 'en_transito' && (
        <div className="pt-3 border-t border-gray-100">
          <button onClick={handleConfirmarRecibida} disabled={loading} className="btn-primary text-xs">
            {loading ? 'Procesando...' : 'Confirmar que el producto llegó de vuelta'}
          </button>
          <p className="text-xs text-gray-400 mt-1.5">Esto crea automáticamente un reembolso pendiente por procesar.</p>
        </div>
      )}

      {solicitud.estado === 'aprobada' && (
        <p className="text-xs text-gray-400 pt-3 border-t border-gray-100">
          Esperando a que el cliente registre el código de rastreo de su envío.
        </p>
      )}
    </div>
  )
}
