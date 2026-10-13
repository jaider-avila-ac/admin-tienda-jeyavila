import { api } from './api'

export const ESTADOS_PEDIDO = [
  'pagado', 'preparando', 'enviado', 'entregado', 'cancelado', 'devuelto',
]

// Para las pestañas de filtro rápido en la tabla de Pedidos: "pagado" se omite ahí porque
// todo pedido que llega a esta lista ya está pagado (Wompi no deja crear uno si el pago no
// se aprobó) — como filtro no distingue nada. El estado en sí se mantiene intacto en
// ESTADOS_PEDIDO (las etiquetas/badges del detalle lo necesitan).
export const ESTADOS_FILTRO_PEDIDOS = ESTADOS_PEDIDO.filter((e) => e !== 'pagado')

// Único paso siguiente válido por estado — espejo de PedidoService.SIGUIENTE_PASO en el
// backend. "cancelado" y "devuelto" no aparecen acá: tienen su propio flujo (botón Cancelar /
// devoluciones), nunca se llega desde el botón de "siguiente paso" (ver F-05 de la auditoría).
export const SIGUIENTE_PASO = {
  pagado: 'preparando',
  preparando: 'enviado',
  enviado: 'entregado',
}

// Estados que acepta la corrección excepcional (saltar/retroceder con motivo obligatorio).
export const ESTADOS_CORREGIBLES = ['pagado', 'preparando', 'enviado', 'entregado']

// Espejo de PagoConfirmacionService.METODOS_VALIDOS (backend) — todo payment_method_type que
// Wompi puede mandar en el webhook, más EFECTIVO (venta local) y OTRO (fallback). Compartido
// entre OrdersPage (columna de la lista) y OrderDetailPage (detalle) para no duplicar el mapa.
export const METODO_PAGO_LABEL = {
  CARD: 'Tarjeta',
  NEQUI: 'Nequi',
  PSE: 'PSE',
  BANCOLOMBIA_TRANSFER: 'Transferencia Bancolombia',
  BANCOLOMBIA_QR: 'QR Bancolombia',
  BANCOLOMBIA_COLLECT: 'Corresponsal Bancolombia',
  BANCOLOMBIA_BNPL: 'Bancolombia a plazos',
  DAVIPLATA: 'Daviplata',
  EFECTIVO: 'Efectivo',
  OTRO: 'Otro',
}

const BASE = '/pedidos'

export const orderService = {
  getAll:       (estado, colaboradorId, sucursalId) => {
    const params = new URLSearchParams()
    if (estado) params.set('estado', estado)
    if (colaboradorId) params.set('colaboradorId', colaboradorId)
    if (sucursalId) params.set('sucursalId', sucursalId)
    const qs = params.toString()
    return api.get(qs ? `${BASE}?${qs}` : BASE)
  },
  getCounts:    ()       => api.get(`${BASE}/conteos`),
  getColaboradores: ()   => api.get(`${BASE}/colaboradores`),
  asignarme:    (id)     => api.post(`${BASE}/${id}/asignarme`),
  asignar:      (id, colaboradorId) => api.patch(`${BASE}/${id}/asignar`, { colaborador_id: colaboradorId }),
  getById:      (id)     => api.get(`${BASE}/${id}`),
  updateEstado: (id, estado) => api.patch(`${BASE}/${id}/estado`, { estado }),
  corregirEstado: (id, estado, motivo) => api.post(`${BASE}/${id}/corregir-estado`, { estado, motivo }),
  resolverAlertaStock: (id) => api.post(`${BASE}/${id}/resolver-alerta-stock`),
  updateSeguimiento: (id, { transportadora, codigoRastreo, link, mostrar }) =>
    api.patch(`${BASE}/${id}/link-seguimiento`, {
      transportadora,
      codigo_rastreo: codigoRastreo,
      link,
      mostrar,
    }),
  cancelar: (id, { motivo, motivoOtro, nota }) =>
    api.post(`${BASE}/${id}/cancelar`, { motivo, motivo_otro: motivoOtro, nota }),
  getHistorial: (id) => api.get(`${BASE}/${id}/historial-estados`),
}

export const MOTIVOS_CANCELACION = [
  { value: 'producto_agotado',      label: 'Producto agotado' },
  { value: 'producto_inconveniente', label: 'Producto con inconvenientes' },
  { value: 'error_precio',          label: 'Error en el precio o la publicación' },
  { value: 'envio_imposible',       label: 'Imposibilidad de realizar el envío' },
  { value: 'compra_duplicada',      label: 'Compra duplicada' },
  { value: 'acordado_cliente',      label: 'Solicitud acordada con el cliente' },
  { value: 'pago_no_confirmado',    label: 'Pago no confirmado a tiempo' },
  { value: 'otro',                  label: 'Otro motivo' },
]
