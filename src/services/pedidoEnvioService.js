import { api } from './api'

// "Preparar envío" + generación de guía real con Envia.com para un pedido — solo aplica a
// tiendas en modo 'envia' (ver TiendaConfigService). PLAN_INTEGRACION_ENVIA.md, Fase 4.
export const pedidoEnvioService = {
  preparar: (pedidoId) => api.get(`/pedidos/${pedidoId}/envio/preparar`),
  generarGuia: (pedidoId, data) => api.post(`/pedidos/${pedidoId}/envio/generar-guia`, data),
}
