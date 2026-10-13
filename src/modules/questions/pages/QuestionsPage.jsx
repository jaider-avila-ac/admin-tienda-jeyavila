import { useEffect, useState } from 'react'
import { History, Trash2, Send } from 'lucide-react'
import { preguntaService } from '../../../services/preguntaService'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import Modal from '../../../components/ui/Modal'
import { formatDate } from '../../../utils/format'

const FILTROS = [
  { value: '',          label: 'Todas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'respondida', label: 'Respondidas' },
  { value: 'eliminada', label: 'Eliminadas' },
]

export default function QuestionsPage() {
  const [preguntas, setPreguntas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('pendiente')
  const [seleccionada, setSeleccionada] = useState(null)
  const [historial, setHistorial] = useState([])
  const [verHistorial, setVerHistorial] = useState(false)
  const [respuesta, setRespuesta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    preguntaService.list(filtro || undefined)
      .then((data) => setPreguntas(Array.isArray(data) ? data : []))
      .catch(() => setPreguntas([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [filtro])

  const abrir = (p) => {
    setSeleccionada(p)
    setRespuesta(p.respuesta_texto ?? '')
    setError('')
    setVerHistorial(false)
    setHistorial([])
  }
  const cerrar = () => setSeleccionada(null)

  const cargarHistorial = async () => {
    if (!seleccionada) return
    setVerHistorial(true)
    try {
      const data = await preguntaService.historial(seleccionada.id)
      setHistorial(Array.isArray(data) ? data : [])
    } catch {
      setHistorial([])
    }
  }

  const handleResponder = async () => {
    if (!respuesta.trim() || !seleccionada) return
    setEnviando(true)
    setError('')
    try {
      await preguntaService.responder(seleccionada.id, respuesta.trim())
      load()
      cerrar()
    } catch {
      setError('No se pudo enviar la respuesta. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  const handleEliminar = async () => {
    if (!seleccionada || !confirm('¿Eliminar esta pregunta? El cliente ya no la verá en la tienda.')) return
    try {
      await preguntaService.eliminar(seleccionada.id)
      load()
      cerrar()
    } catch {
      setError('No se pudo eliminar. Intenta de nuevo.')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Preguntas</h1>
        <p className="page-subtitle">Preguntas que los clientes hacen sobre los productos, y sus respuestas.</p>
      </div>

      <div className="section-card px-5 py-4">
        <div className="flex gap-1.5 flex-wrap">
          {FILTROS.map((f) => (
            <button key={f.value} onClick={() => setFiltro(f.value)}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${filtro === f.value ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="section-card">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
        ) : preguntas.length === 0 ? (
          <EmptyState title="Sin preguntas" description="No hay preguntas con ese filtro." />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header px-5 py-3 text-left">Producto</th>
                <th className="table-header px-4 py-3 text-left">Cliente</th>
                <th className="table-header px-4 py-3 text-left">Pregunta</th>
                <th className="table-header px-4 py-3 text-left">Estado</th>
                <th className="table-header px-4 py-3 text-left">Respondido por</th>
                <th className="table-header px-4 py-3 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {preguntas.map((p) => (
                <tr key={p.id} onClick={() => abrir(p)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="table-cell px-5 text-black font-medium">{p.prd_nombre ?? '—'}</td>
                  <td className="table-cell px-4 text-gray-600">{p.cliente_nombre}</td>
                  <td className="table-cell px-4 text-gray-600 max-w-xs truncate">{p.texto}</td>
                  <td className="table-cell px-4">
                    {p.eliminada ? (
                      <Badge variant="danger">Eliminada{p.eliminada_por ? ` (${p.eliminada_por})` : ''}</Badge>
                    ) : p.respuesta_texto ? (
                      <Badge variant="success">Respondida</Badge>
                    ) : (
                      <Badge variant="warning">Pendiente</Badge>
                    )}
                    {p.editada && <span className="ml-1.5 text-[10px] text-gray-400">editada</span>}
                  </td>
                  <td className="table-cell px-4 text-gray-600">
                    {p.respuesta_admin_nombre ?? '—'}
                    {p.respuesta_editada && <span className="ml-1 text-[10px] text-gray-400">(editada)</span>}
                  </td>
                  <td className="table-cell px-4 text-gray-500">{formatDate(p.creado_en)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!seleccionada} onClose={cerrar} title="Pregunta del cliente" size="lg">
        {seleccionada && (
          <div className="p-6 space-y-4 overflow-y-auto">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Producto</p>
              <p className="text-sm font-bold text-black">{seleccionada.prd_nombre ?? 'Producto eliminado'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {seleccionada.cliente_nombre} · {seleccionada.cliente_email}
              </p>
              <p className="text-sm text-gray-700 mt-1">{seleccionada.texto}</p>
              {seleccionada.editada && (
                <button onClick={cargarHistorial} className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-black transition-colors">
                  <History size={12} /> Esta pregunta fue editada — ver historial
                </button>
              )}
            </div>

            {seleccionada.eliminada && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700">
                Eliminada por {seleccionada.eliminada_por === 'cliente' ? 'el cliente' : 'un administrador'}
                {seleccionada.eliminada_en ? ` el ${formatDate(seleccionada.eliminada_en)}` : ''}.
                No es visible en la tienda, pero se conserva acá para auditoría.
              </div>
            )}

            {verHistorial && (
              <div className="p-3 bg-gray-50 border border-gray-100 space-y-2">
                <p className="text-xs font-bold text-black">Historial de ediciones</p>
                {historial.length === 0 ? (
                  <p className="text-xs text-gray-400">Sin versiones anteriores registradas.</p>
                ) : (
                  historial.map((h, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-semibold text-gray-500">
                        {h.campo === 'pregunta' ? 'Pregunta anterior' : 'Respuesta anterior'} · {formatDate(h.editado_en)}
                      </span>
                      <p className="text-gray-600 mt-0.5">{h.texto_anterior}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {seleccionada.respuesta_texto && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Respondida por {seleccionada.respuesta_admin_nombre ?? 'un administrador'}
                  {seleccionada.respuesta_editada ? ' (editada)' : ''}
                </p>
              </div>
            )}

            {!seleccionada.eliminada && (
              <div>
                <label className="label-field">{seleccionada.respuesta_texto ? 'Corregir respuesta' : 'Responder'}</label>
                <textarea
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  rows={3}
                  placeholder="Escribe la respuesta para el cliente..."
                  className="input-field bg-white resize-none"
                />
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button onClick={handleEliminar} className="btn-danger text-xs">
                <Trash2 size={13} /> Eliminar
              </button>
              {!seleccionada.eliminada && (
                <button onClick={handleResponder} disabled={enviando || !respuesta.trim()} className="btn-primary text-xs">
                  <Send size={13} /> {enviando ? 'Enviando...' : 'Enviar respuesta'}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
