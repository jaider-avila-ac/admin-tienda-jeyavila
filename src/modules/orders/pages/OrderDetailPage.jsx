import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, CreditCard, Package, Truck, AlertTriangle, Link2, Ban, History, UserPlus, UserCog } from 'lucide-react'
import { orderService, ESTADOS_PEDIDO, ESTADOS_CORREGIBLES, SIGUIENTE_PASO, MOTIVOS_CANCELACION, METODO_PAGO_LABEL } from '../../../services/orderService'
import { reembolsoService } from '../../../services/reembolsoService'
import { authService } from '../../../services/authService'
import { tiendaConfigService } from '../../../services/tiendaConfigService'
import { pedidoEnvioService } from '../../../services/pedidoEnvioService'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import { formatCurrency, formatDate } from '../../../utils/format'

const REEMBOLSO_BADGE = { pendiente: 'warning', en_proceso: 'info', completado: 'success', rechazado: 'danger', error: 'danger' }
const REEMBOLSO_LABEL = { pendiente: 'Pendiente', en_proceso: 'En proceso', completado: 'Completado', rechazado: 'Rechazado', error: 'Error' }

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

// Qué significa cada paso de avance, para que quien lo marque sepa exactamente qué está
// confirmando (no solo un nombre de estado sin contexto).
const ESTADO_DESCRIPCION = {
  preparando: 'Confirma que ya alguien está armando/empacando este pedido — no que ya está listo.',
  enviado:    'Confirma que el paquete ya salió de la tienda rumbo al cliente, con la transportadora y guía de arriba.',
  entregado:  'Confirma que el cliente ya recibió el pedido en sus manos.',
}

// Lista fija de transportadoras — el backend solo guarda el texto, no valida contra esto.
const TRANSPORTADORAS = ['Envía', 'Coordinadora', 'Interrapidísimo', 'Servientrega', 'Otra']

const MOSTRAR_OPCIONES = [
  { value: 'ambos',  label: 'Código y link' },
  { value: 'codigo', label: 'Solo código' },
  { value: 'link',   label: 'Solo link' },
]

const SEGUIMIENTO_VACIO = { transportadora: '', codigoRastreo: '', link: '', mostrar: 'ambos' }

const CARRIER_LABELS = {
  servientrega: 'Servientrega', coordinadora: 'Coordinadora',
  interrapidisimo: 'Interrapidísimo', envia: 'Envía',
}
const carrierLabel = (carrier) => CARRIER_LABELS[carrier] ?? carrier

/** Reemplaza el formulario manual de transportadora/tracking cuando la tienda cotiza y cobra
 *  el envío real con Envia.com (envio_modo='envia') — PLAN_INTEGRACION_ENVIA.md, Fase 4. Las
 *  tiendas en 'contra_entrega'/'fijo' nunca ven esto ni se ven afectadas por él. */
function EnvioRealSection({ order, isAdmin }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [elegida, setElegida] = useState(null)
  const [generando, setGenerando] = useState(false)
  const [resultado, setResultado] = useState(null)

  const cargar = () => {
    setLoading(true)
    setError('')
    pedidoEnvioService.preparar(order.id)
      .then(setData)
      .catch((err) => setError(err.message || 'No se pudo preparar el envío'))
      .finally(() => setLoading(false))
  }

  useEffect(cargar, [order.id])

  const generar = async () => {
    if (!isAdmin || !elegida) return
    if (!confirm(`¿Generar la guía real con ${carrierLabel(elegida.carrier)} — ${elegida.servicio_descripcion} por ${formatCurrency(elegida.precio_cop)}? Esto cobra de la cuenta de Envia de la tienda y no se puede deshacer.`)) return
    setGenerando(true)
    setError('')
    try {
      const guia = await pedidoEnvioService.generarGuia(order.id, {
        carrier: elegida.carrier,
        servicio: elegida.servicio_codigo,
      })
      setResultado(guia)
    } catch (err) {
      setError(err.message || 'Envia no pudo generar la guía')
    } finally {
      setGenerando(false)
    }
  }

  if (loading) {
    return (
      <div className="section-card p-5">
        <p className="text-xs text-gray-400">Cargando cotizaciones de envío…</p>
      </div>
    )
  }

  const yaGenerada = Boolean(resultado || data?.guia_ya_generada)

  return (
    <div className="section-card p-5 space-y-3">
      <h2 className="text-sm font-bold text-black flex items-center gap-1.5">
        <Truck size={15} /> Envío real (Envia.com)
      </h2>

      {data?.paquetes?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.paquetes.map((p, i) => (
            <span key={i} className="text-[11px] bg-gray-50 border border-gray-100 px-2 py-1 text-gray-500">
              {p.cantidad}× {p.empaque_nombre} ({p.largo_cm}×{p.ancho_cm}×{p.alto_cm} cm, {p.peso_gramos_por_unidad} g c/u)
            </span>
          ))}
        </div>
      )}

      {yaGenerada ? (
        <div className="bg-green-50 border-l-4 border-green-500 p-3 space-y-1">
          <p className="text-sm font-bold text-green-700">Guía generada</p>
          <p className="text-xs text-green-700">
            {carrierLabel(resultado?.carrier ?? data.transportadora_actual)} — tracking {resultado?.tracking_number ?? data.codigo_rastreo_actual}
          </p>
          {/* resultado (respuesta inmediata de generar-guia) trae el precio en pesos; el
              costo persistido (data, tras recargar) viene en centavos como el resto de montos
              de dinero de la API — ver order.reembolso.monto_centavos más abajo. */}
          {(resultado?.total_price_cop != null || data?.costo_real_centavos_actual != null) && (
            <p className="text-xs text-green-700">
              Costo real cobrado: {formatCurrency(resultado?.total_price_cop ?? data.costo_real_centavos_actual / 100)}
            </p>
          )}
          {(resultado?.shipment_id ?? data?.shipment_id_actual) && (
            <p className="text-xs text-green-700">Shipment ID: {resultado?.shipment_id ?? data.shipment_id_actual}</p>
          )}
          {(resultado?.label_url ?? data.guia_url_actual) && (
            <a href={resultado?.label_url ?? data.guia_url_actual} target="_blank" rel="noopener noreferrer"
              className="text-xs text-admin-accent hover:underline inline-block mt-1">
              Descargar guía (PDF) →
            </a>
          )}
        </div>
      ) : (
        <>
          {data?.cotizaciones?.length > 0 ? (
            <div className="space-y-1.5">
              {data.cotizaciones.map((c, i) => (
                <label key={i} className={`flex items-center justify-between gap-3 p-2.5 border text-xs ${isAdmin ? 'cursor-pointer' : ''} ${
                  elegida === c ? 'border-admin-accent bg-admin-accent/5' : 'border-gray-200'
                }`}>
                  <span className="flex items-center gap-2">
                    {isAdmin && (
                      <input type="radio" name="cotizacion" checked={elegida === c} onChange={() => setElegida(c)} className="accent-black" />
                    )}
                    <span>
                      <span className="font-semibold text-black">{carrierLabel(c.carrier)}</span> — {c.servicio_descripcion}
                      {c.tiempo_estimado && <span className="text-gray-400"> ({c.tiempo_estimado})</span>}
                    </span>
                  </span>
                  <span className="font-bold text-black">{formatCurrency(c.precio_cop)}</span>
                </label>
              ))}
              {isAdmin ? (
                <button onClick={generar} disabled={!elegida || generando} className="btn-primary text-xs mt-2 disabled:opacity-50">
                  {generando ? 'Generando...' : 'Generar guía real (cobra ya)'}
                </button>
              ) : (
                <p className="text-xs text-gray-400 mt-2">Solo el administrador puede generar la guía real.</p>
              )}
            </div>
          ) : (
            !error && <p className="text-xs text-gray-400">Ninguna transportadora respondió con una cotización para esta dirección.</p>
          )}
        </>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default function OrderDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [order,   setOrder]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [seguimiento, setSeguimiento] = useState(SEGUIMIENTO_VACIO)
  const [savingSeguimiento, setSavingSeguimiento] = useState(false)
  const [seguimientoError, setSeguimientoError] = useState('')
  const [savingEstado, setSavingEstado] = useState(false)
  const [estadoError, setEstadoError] = useState('')
  const [correccionOpen, setCorreccionOpen] = useState(false)
  const [correccionEstado, setCorreccionEstado] = useState('')
  const [correccionMotivo, setCorreccionMotivo] = useState('')
  const [correccionLoading, setCorreccionLoading] = useState(false)
  const [correccionError, setCorreccionError] = useState('')

  const [historial, setHistorial] = useState([])
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelMotivo, setCancelMotivo] = useState('')
  const [cancelMotivoOtro, setCancelMotivoOtro] = useState('')
  const [cancelNota, setCancelNota] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [reembolsoNota, setReembolsoNota] = useState('')
  const [reembolsoLoading, setReembolsoLoading] = useState(false)
  const [reembolsoError, setReembolsoError] = useState('')

  const [colaboradores, setColaboradores] = useState([])
  const [tomando, setTomando] = useState(false)
  const [asignError, setAsignError] = useState('')

  // Determina si esta tienda cotiza/cobra el envío real (Envia.com) o usa el flujo manual de
  // siempre — las tiendas en 'contra_entrega'/'fijo' nunca ven el cambio.
  const [envioModo, setEnvioModo] = useState(null)
  useEffect(() => {
    tiendaConfigService.get()
      .then((cfg) => setEnvioModo(cfg?.envio_modo ?? 'contra_entrega'))
      .catch(() => setEnvioModo('contra_entrega'))
  }, [])

  const user = authService.getUser()
  const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin'

  const load = () => {
    setLoading(true)
    orderService.getById(id)
      .then((data) => {
        setOrder(data)
        setSeguimiento({
          transportadora: data.transportadora ?? '',
          codigoRastreo: data.codigo_rastreo ?? '',
          link: data.link_seguimiento ?? '',
          mostrar: data.mostrar_seguimiento ?? 'ambos',
        })
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
    orderService.getHistorial(id).then(setHistorial).catch(() => setHistorial([]))
  }

  useEffect(load, [id])

  useEffect(() => {
    if (isAdmin) {
      orderService.getColaboradores().then((d) => setColaboradores(Array.isArray(d) ? d : [])).catch(() => {})
    }
  }, [isAdmin])

  const puedeCancelar = isAdmin && order && !['cancelado', 'devuelto', 'entregado'].includes(order.estado)

  const abrirCancelar = () => {
    setCancelMotivo('')
    setCancelMotivoOtro('')
    setCancelNota('')
    setCancelError('')
    setCancelOpen(true)
  }

  const handleCancelar = async () => {
    if (!cancelMotivo) { setCancelError('Selecciona un motivo'); return }
    if (cancelMotivo === 'otro' && !cancelMotivoOtro.trim()) {
      setCancelError('Explica el motivo en el campo de abajo'); return
    }
    setCancelLoading(true)
    setCancelError('')
    try {
      await orderService.cancelar(id, { motivo: cancelMotivo, motivoOtro: cancelMotivoOtro.trim() || null, nota: cancelNota.trim() || null })
      setCancelOpen(false)
      load()
    } catch (err) {
      setCancelError(err.message || 'No se pudo cancelar la compra')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleConfirmarReembolso = async (estado) => {
    setReembolsoLoading(true)
    setReembolsoError('')
    try {
      await reembolsoService.confirmar(order.reembolso.id, estado, reembolsoNota.trim() || null)
      setReembolsoNota('')
      load()
    } catch (err) {
      setReembolsoError(err.message || 'No se pudo confirmar el reembolso')
    } finally {
      setReembolsoLoading(false)
    }
  }

  const handleAvanzarEstado = async () => {
    const siguiente = SIGUIENTE_PASO[order.estado]
    if (!siguiente) return
    setSavingEstado(true)
    setEstadoError('')
    try {
      await orderService.updateEstado(id, siguiente)
      load()
    } catch (err) {
      setEstadoError(err.message || 'No se pudo cambiar el estado')
    } finally {
      setSavingEstado(false)
    }
  }

  const abrirCorreccion = () => {
    setCorreccionEstado('')
    setCorreccionMotivo('')
    setCorreccionError('')
    setCorreccionOpen(true)
  }

  const handleCorregirEstado = async () => {
    if (!correccionEstado) { setCorreccionError('Selecciona el estado correcto'); return }
    if (!correccionMotivo.trim()) { setCorreccionError('Explica el motivo de la corrección'); return }
    setCorreccionLoading(true)
    setCorreccionError('')
    try {
      await orderService.corregirEstado(id, correccionEstado, correccionMotivo.trim())
      setCorreccionOpen(false)
      load()
    } catch (err) {
      setCorreccionError(err.message || 'No se pudo corregir el estado')
    } finally {
      setCorreccionLoading(false)
    }
  }

  const handleTomar = async () => {
    setTomando(true)
    setAsignError('')
    try {
      await orderService.asignarme(id)
      load()
    } catch (err) {
      setAsignError(err.message || 'No se pudo tomar el pedido')
    } finally {
      setTomando(false)
    }
  }

  const handleAsignar = async (e) => {
    const value = e.target.value
    const colaboradorId = value === '' ? null : Number(value)
    setTomando(true)
    setAsignError('')
    try {
      await orderService.asignar(id, colaboradorId)
      load()
    } catch (err) {
      setAsignError(err.message || 'No se pudo reasignar el pedido')
    } finally {
      setTomando(false)
    }
  }

  const handleResolverAlerta = async () => {
    setResolving(true)
    try {
      await orderService.resolverAlertaStock(id)
      load()
    } finally {
      setResolving(false)
    }
  }

  const setSeguimientoField = (field) => (e) =>
    setSeguimiento((prev) => ({ ...prev, [field]: e.target.value }))

  const handleGuardarSeguimiento = async () => {
    setSavingSeguimiento(true)
    setSeguimientoError('')
    try {
      await orderService.updateSeguimiento(id, {
        transportadora: seguimiento.transportadora.trim(),
        codigoRastreo: seguimiento.codigoRastreo.trim(),
        link: seguimiento.link.trim(),
        mostrar: seguimiento.mostrar,
      })
      load()
    } catch (err) {
      setSeguimientoError(err.message || 'No se pudo guardar')
    } finally {
      setSavingSeguimiento(false)
    }
  }

  if (loading) {
    return <div className="py-16 text-center text-sm text-gray-400">Cargando pedido…</div>
  }

  if (notFound || !order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">Pedido no encontrado</p>
        <button onClick={() => navigate('/pedidos')} className="btn-primary mt-4 mx-auto">Volver</button>
      </div>
    )
  }

  const dir = order.dir_snapshot ?? {}

  // Mismas condiciones que ya exige el backend (PedidoService.updateEstado) para este mismo
  // avance — mostrarlas ANTES de hacer clic, no solo como error después, para que el botón
  // tenga sentido en vez de parecer habilitado y fallar en silencio con un texto chico.
  const siguienteEstado = SIGUIENTE_PASO[order.estado]
  const bloqueoAvance =
    siguienteEstado === 'preparando' && order.alerta_stock
      ? 'Resuelve la alerta de stock antes de continuar'
      : (siguienteEstado === 'preparando' || siguienteEstado === 'enviado') && !order.colaborador_id
      ? 'Asigna un responsable antes de continuar'
      : siguienteEstado === 'enviado' && envioModo !== 'envia' && (!order.transportadora || !order.codigo_rastreo)
      ? 'Registra la transportadora y el número de guía antes de continuar'
      : null

  // El pedido es un flujo de un solo sentido: responsable → preparando → seguimiento →
  // enviado → entregado. Antes se podía llenar la transportadora/guía desde que el pedido
  // apenas estaba "pagado" (sin ni siquiera estar en preparación todavía) y el botón de avance
  // vivía arriba del todo, lejos de lo que en realidad le faltaba — dos cosas sueltas que no
  // seguían ningún orden. Ahora el seguimiento ni siquiera se puede tocar hasta que el pedido
  // ya esté "preparando" o más adelante.
  const puedeVerSeguimiento = ['preparando', 'enviado', 'entregado'].includes(order.estado)

  const avanceBloque = siguienteEstado && (
    <div className="section-card p-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-xs text-gray-500 mb-2">{ESTADO_DESCRIPCION[siguienteEstado]}</p>
        <button
          onClick={handleAvanzarEstado}
          disabled={savingEstado || Boolean(bloqueoAvance)}
          title={bloqueoAvance ?? undefined}
          className="btn-primary text-xs disabled:opacity-60"
        >
          {savingEstado ? 'Guardando…' : `Marcar como ${ESTADO_LABEL[siguienteEstado]}`}
        </button>
        {bloqueoAvance && <p className="text-[11px] text-amber-600 mt-1.5">{bloqueoAvance}</p>}
        {estadoError && <p className="text-[11px] text-red-500 mt-1.5">{estadoError}</p>}
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/pedidos')} className="p-2 hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title">{order.numero}</h1>
            {order.canal === 'local' && <Badge variant="default">Venta local</Badge>}
          </div>
          <p className="page-subtitle">{formatDate(order.creado_en)}</p>
        </div>
        <div className="ml-auto flex flex-col items-end gap-1">
          <Badge variant={BADGE_MAP[order.estado]}>{ESTADO_LABEL[order.estado]}</Badge>
          {puedeCancelar && (
            <button onClick={abrirCancelar} className="text-[11px] font-semibold text-red-500 hover:text-red-600 flex items-center gap-1 mt-1">
              <Ban size={12} /> Cancelar compra y reembolsar
            </button>
          )}
          {isAdmin && ESTADOS_CORREGIBLES.includes(order.estado) && (
            <button onClick={abrirCorreccion} className="text-[11px] font-semibold text-gray-400 hover:text-black transition-colors mt-0.5">
              Corregir estado…
            </button>
          )}
        </div>
      </div>

      {/* Alerta de stock insuficiente al confirmar el pago — primero, porque bloquea todo lo
          demás (ni responsable ni preparación tienen caso mientras esto no se resuelva). */}
      {order.alerta_stock && (
        <div className="section-card p-4 border-l-4 border-red-500 bg-red-50 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-700">Faltante de stock sin resolver</p>
            <p className="text-xs text-red-600 mt-0.5">
              El pago de este pedido ya fue aprobado, pero al confirmarlo no había stock suficiente
              para uno o más productos (marcados abajo). Contacta al cliente, reabastece o gestiona
              un reembolso parcial, y luego marca la alerta como resuelta para poder prepararlo.
            </p>
            <button
              onClick={handleResolverAlerta}
              disabled={resolving}
              className="btn-danger text-xs mt-3"
            >
              {resolving ? 'Guardando…' : 'Marcar como resuelto'}
            </button>
          </div>
        </div>
      )}

      {/* Responsable del pedido — cualquier staff puede tomarlo; admin puede reasignar/desasignar.
          Paso 1 del flujo: sin esto no tiene caso intentar marcar "preparando" (ver avanceBloque). */}
      <div className="section-card p-4 flex items-center gap-3">
        <UserCog size={16} className="text-gray-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-gray-500 flex-shrink-0">Responsable:</span>
        {isAdmin ? (
          <select
            value={order.colaborador_id ?? ''}
            onChange={handleAsignar}
            disabled={tomando}
            className="input-field bg-white text-xs py-1.5 w-auto disabled:opacity-60"
          >
            {/* Desde "preparando" en adelante ya se exigió un responsable para llegar hasta
                acá (ver avanceBloque) — quitarlo del todo contradiría eso, así que esa opción
                ni se ofrece; el backend lo rechaza igual si de algún modo llegara a pedirse. */}
            {!puedeVerSeguimiento && <option value="">Sin asignar</option>}
            {colaboradores.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        ) : order.colaborador_nombre ? (
          <span className="text-xs font-semibold text-black">{order.colaborador_nombre}</span>
        ) : (
          <button onClick={handleTomar} disabled={tomando} className="flex items-center gap-1 text-xs text-admin-accent hover:underline disabled:opacity-50">
            <UserPlus size={13} /> {tomando ? 'Tomando...' : 'Hacerme responsable'}
          </button>
        )}
        {asignError && <span className="text-[11px] text-red-500">{asignError}</span>}
      </div>

      {/* Paso 2: avanzar a "preparando" — justo debajo de responsable, de donde depende. */}
      {siguienteEstado === 'preparando' && avanceBloque}

      {/* Cancelación por el admin — motivo, nota y estado del reembolso */}
      {order.cancel_motivo && (
        <div className="section-card p-4 border-l-4 border-red-500 bg-red-50 space-y-2">
          <p className="text-sm font-bold text-red-700 flex items-center gap-1.5">
            <Ban size={15} /> Compra cancelada por la tienda
          </p>
          <p className="text-xs text-red-600">
            <span className="font-semibold">Motivo:</span> {MOTIVOS_CANCELACION.find((m) => m.value === order.cancel_motivo)?.label ?? order.cancel_motivo}
            {order.cancel_motivo_otro && ` — ${order.cancel_motivo_otro}`}
          </p>
          {order.cancel_nota && (
            <p className="text-xs text-red-600"><span className="font-semibold">Nota:</span> {order.cancel_nota}</p>
          )}
          <p className="text-xs text-red-500">Cancelada el {formatDate(order.cancelado_en)}</p>

          {order.reembolso && (
            <div className="pt-2 border-t border-red-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-red-700">Reembolso:</span>
                <Badge variant={REEMBOLSO_BADGE[order.reembolso.estado]}>{REEMBOLSO_LABEL[order.reembolso.estado]}</Badge>
                <span className="text-xs text-red-600">{formatCurrency(order.reembolso.monto_centavos / 100)}</span>
                {order.metodo_pago && <span className="text-xs text-red-500">— {METODO_PAGO_LABEL[order.metodo_pago] ?? order.metodo_pago}</span>}
              </div>
              {order.reembolso.error_mensaje && (
                <p className="text-xs text-red-500">{order.reembolso.error_mensaje}</p>
              )}
              {isAdmin && ['pendiente', 'en_proceso'].includes(order.reembolso.estado) && (
                <div className="space-y-1.5">
                  <textarea value={reembolsoNota} onChange={(e) => setReembolsoNota(e.target.value)} rows={2}
                    className="input-field bg-white resize-none text-xs" placeholder="Nota (ej. confirmado por transferencia Bancolombia el...)" />
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleConfirmarReembolso('completado')} disabled={reembolsoLoading} className="btn-primary text-xs">
                      {reembolsoLoading ? 'Guardando...' : 'Marcar reembolso completado'}
                    </button>
                    <button onClick={() => handleConfirmarReembolso('error')} disabled={reembolsoLoading} className="btn-danger text-xs">
                      Marcar con error
                    </button>
                  </div>
                  {reembolsoError && <p className="text-xs text-red-500">{reembolsoError}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Historial de estados */}
      {historial.length > 0 && (
        <div className="section-card p-4">
          <h2 className="text-sm font-bold text-black flex items-center gap-1.5 mb-2">
            <History size={15} /> Historial
          </h2>
          <div className="space-y-1.5">
            {historial.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  <span className="font-semibold text-black">{ESTADO_LABEL[h.estado] ?? h.estado}</span>
                  {h.admin && ` — ${h.admin}`}
                  {h.nota && <span className="text-gray-400"> ({h.nota})</span>}
                </span>
                <span className="text-gray-400">{formatDate(h.fecha)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paso 3: seguimiento del envío — real (Envia.com) si la tienda cotiza envío real, manual
          si no. Solo visible desde "preparando" en adelante: antes no tiene sentido llenar
          transportadora/guía de un pedido que ni siquiera se empezó a armar. */}
      {puedeVerSeguimiento && envioModo === 'envia' && (
        <EnvioRealSection order={order} isAdmin={isAdmin} />
      )}
      {puedeVerSeguimiento && envioModo !== null && envioModo !== 'envia' && (
        <div className="section-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-black flex items-center gap-1.5">
              <Link2 size={15} /> Seguimiento del envío
            </h2>
            {order.confirmado_cliente_en ? (
              <span className="text-xs font-semibold text-green-600">
                Cliente confirmó recibido — {formatDate(order.confirmado_cliente_en)}
              </span>
            ) : (
              <span className="text-xs text-gray-400">El cliente aún no confirmó recibido</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label-field">Transportadora</label>
              <select
                value={seguimiento.transportadora}
                onChange={setSeguimientoField('transportadora')}
                className="input-field bg-white"
              >
                <option value="">Selecciona...</option>
                {TRANSPORTADORAS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Código de rastreo / guía</label>
              <input
                type="text"
                value={seguimiento.codigoRastreo}
                onChange={setSeguimientoField('codigoRastreo')}
                placeholder="Ej: 123456789"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="label-field">Link de seguimiento</label>
            <input
              type="text"
              value={seguimiento.link}
              onChange={setSeguimientoField('link')}
              placeholder="https://..."
              className="input-field"
            />
          </div>

          <div>
            <label className="label-field">Qué le muestra a la tienda</label>
            <div className="flex gap-4 pt-1">
              {MOSTRAR_OPCIONES.map((op) => (
                <label key={op.value} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="mostrar_seguimiento"
                    value={op.value}
                    checked={seguimiento.mostrar === op.value}
                    onChange={setSeguimientoField('mostrar')}
                    className="accent-black"
                  />
                  {op.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button onClick={handleGuardarSeguimiento} disabled={savingSeguimiento} className="btn-primary text-xs px-4">
              {savingSeguimiento ? 'Guardando…' : 'Guardar'}
            </button>
            {order.link_seguimiento && (
              <a
                href={order.link_seguimiento}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-admin-accent hover:underline"
              >
                Abrir link actual →
              </a>
            )}
          </div>
          {seguimientoError && <p className="text-xs text-red-500">{seguimientoError}</p>}
        </div>
      )}

      {/* Paso 4: avanzar a "enviado" (o a "entregado" una vez ya enviado) — justo debajo del
          seguimiento, de donde depende "enviado". */}
      {(siguienteEstado === 'enviado' || siguienteEstado === 'entregado') && avanceBloque}

      {/* Info del cliente */}
      <div className="section-card p-5 space-y-3">
        <h2 className="text-sm font-bold text-black">Destinatario</h2>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-violet-950 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {order.cliente_nombre?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-black">
              {dir.contacto_nombre ?? order.cliente_nombre}
            </p>
            <p className="text-xs text-gray-400">{order.cliente_email}</p>
            {dir.direccion && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin size={12} />
                {dir.direccion}
                {dir.complemento ? `, ${dir.complemento}` : ''}
                {dir.barrio ? `, ${dir.barrio}` : ''}
                {dir.municipio ? `, ${dir.municipio}` : ''}
                {dir.departamento ? ` (${dir.departamento})` : ''}
              </div>
            )}
            {dir.contacto_telefono && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <CreditCard size={12} /> {dir.contacto_telefono}
              </div>
            )}
          </div>
        </div>
        {order.notas && (
          <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2">
            <span className="font-semibold">Nota:</span> {order.notas}
          </p>
        )}
      </div>

      {/* Items del pedido */}
      <div className="section-card">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-black">Productos del pedido</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {(order.items ?? []).map((item) => {
            // variantes_snap es objeto arbitrario: {Talla: "40", Color: "Negro", ...}
            const variantesTexto = Object.entries(item.variantes_snap ?? {})
              .map(([k, v]) => `${k}: ${v}`)
              .join(' · ')

            return (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                {item.imagen_snap ? (
                  <img src={item.imagen_snap} alt={item.nombre_snap}
                    className="w-12 h-12 object-cover bg-gray-100 flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Package size={18} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-black flex items-center gap-1.5">
                    {item.nombre_snap}
                    {item.stock_insuficiente && (
                      <AlertTriangle size={13} className="text-red-500 flex-shrink-0" title="Sin stock suficiente al confirmar el pago" />
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {variantesTexto && `${variantesTexto} · `}Cant: {item.cantidad}
                  </p>
                  {item.stock_insuficiente && (
                    <p className="text-xs text-red-500 font-medium">Sin stock suficiente</p>
                  )}
                  {item.descuento_unitario > 0 && (
                    <p className="text-xs text-admin-accent">Descuento: -{formatCurrency(item.descuento_unitario)}</p>
                  )}
                </div>
                <p className="text-sm font-bold text-black">{formatCurrency(item.subtotal)}</p>
              </div>
            )
          })}
        </div>

        {/* Resumen de precios */}
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          <div className="flex justify-between px-5 py-2.5 text-sm text-gray-500">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.descuento > 0 && (
            <div className="flex justify-between px-5 py-2.5 text-sm text-admin-accent">
              <span>Descuento</span>
              <span>-{formatCurrency(order.descuento)}</span>
            </div>
          )}
          <div className="flex justify-between px-5 py-2.5 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Truck size={13} /> Envío</span>
            <span>
              {order.envio_contra_entrega
                ? 'Paga contra entrega'
                : order.envio === 0 ? 'Gratis' : formatCurrency(order.envio)}
            </span>
          </div>
          <div className="flex justify-between items-center px-5 py-4 bg-gray-50">
            <span className="text-sm font-semibold text-gray-700">Total del pedido</span>
            <span className="text-lg font-black text-black">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancelar compra y reembolsar" size="md">
        <div className="space-y-3">
          <div>
            <label className="label-field">Motivo de la cancelación</label>
            <select value={cancelMotivo} onChange={(e) => setCancelMotivo(e.target.value)} className="input-field bg-white">
              <option value="">Selecciona un motivo...</option>
              {MOTIVOS_CANCELACION.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          {cancelMotivo === 'otro' && (
            <div>
              <label className="label-field">Explica el motivo</label>
              <textarea value={cancelMotivoOtro} onChange={(e) => setCancelMotivoOtro(e.target.value)} rows={2}
                className="input-field bg-white resize-none" placeholder="Describe el motivo de la cancelación..." />
            </div>
          )}

          <div>
            <label className="label-field">Nota adicional para el cliente (opcional)</label>
            <textarea value={cancelNota} onChange={(e) => setCancelNota(e.target.value)} rows={2}
              className="input-field bg-white resize-none" placeholder="Información extra que verá el cliente..." />
          </div>

          <div className="bg-gray-50 p-3 space-y-1 text-xs text-gray-600">
            <p><span className="font-semibold">Total a reembolsar:</span> {formatCurrency(order.total)}</p>
            <p><span className="font-semibold">Método de pago:</span> {order.metodo_pago ? (METODO_PAGO_LABEL[order.metodo_pago] ?? order.metodo_pago) : 'Sin pago registrado'}</p>
            {cancelMotivo && (
              <p><span className="font-semibold">El cliente verá:</span> {MOTIVOS_CANCELACION.find((m) => m.value === cancelMotivo)?.label}{cancelMotivoOtro ? ` — ${cancelMotivoOtro}` : ''}{cancelNota ? `. ${cancelNota}` : ''}</p>
            )}
          </div>

          <p className="text-xs text-red-500 font-medium flex items-center gap-1.5">
            <AlertTriangle size={13} className="flex-shrink-0" />
            Esta acción cancela la compra y no se puede deshacer fácilmente.
          </p>

          {cancelError && <p className="text-xs text-red-500">{cancelError}</p>}

          <button onClick={handleCancelar} disabled={cancelLoading} className="btn-danger text-xs w-full justify-center">
            {cancelLoading ? 'Procesando...' : 'Confirmar cancelación y reembolso'}
          </button>
        </div>
      </Modal>

      <Modal open={correccionOpen} onClose={() => setCorreccionOpen(false)} title="Corregir estado" size="md">
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Para saltar pasos o retroceder el estado (ej. te equivocaste al marcarlo). Queda registrado
            en el historial y la auditoría con el motivo que expliques.
          </p>
          <div>
            <label className="label-field">Estado correcto</label>
            <select value={correccionEstado} onChange={(e) => setCorreccionEstado(e.target.value)} className="input-field bg-white">
              <option value="">Selecciona...</option>
              {ESTADOS_CORREGIBLES.filter((e) => e !== order.estado).map((e) => (
                <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Motivo de la corrección</label>
            <textarea value={correccionMotivo} onChange={(e) => setCorreccionMotivo(e.target.value)} rows={2}
              className="input-field bg-white resize-none" placeholder="Ej: se marcó como enviado por error, todavía está en preparación..." />
          </div>
          {correccionError && <p className="text-xs text-red-500">{correccionError}</p>}
          <button onClick={handleCorregirEstado} disabled={correccionLoading} className="btn-primary text-xs w-full justify-center">
            {correccionLoading ? 'Guardando...' : 'Confirmar corrección'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
