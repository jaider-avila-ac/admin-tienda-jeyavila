import { api } from './api'

const BASE = '/reportes'

function withFiltros(path, mes, colaboradorId, sucursalId) {
  const params = new URLSearchParams()
  if (mes) params.set('mes', mes)
  if (colaboradorId) params.set('colaboradorId', colaboradorId)
  if (sucursalId) params.set('sucursalId', sucursalId)
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

function withRango(path, desde, hasta, extra = {}) {
  const params = new URLSearchParams(extra)
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

export const reportService = {
  resumen:              (mes, colaboradorId, sucursalId) => api.get(withFiltros(`${BASE}/resumen`, mes, colaboradorId, sucursalId)),
  pedidosPorEstado:     (mes, colaboradorId, sucursalId) => api.get(withFiltros(`${BASE}/pedidos-por-estado`, mes, colaboradorId, sucursalId)),
  productosMasVendidos: (mes, colaboradorId, sucursalId) => api.get(withFiltros(`${BASE}/productos-mas-vendidos`, mes, colaboradorId, sucursalId)),
  ventasPorCategoria:   (mes, colaboradorId, sucursalId) => api.get(withFiltros(`${BASE}/ventas-por-categoria`, mes, colaboradorId, sucursalId)),
  ventasPorCanal:       (mes, colaboradorId, sucursalId) => api.get(withFiltros(`${BASE}/ventas-por-canal`, mes, colaboradorId, sucursalId)),

  // Analítica de tráfico (visitantes anónimos + registrados) — ver VisitaService en el backend.
  visitasResumen:          (desde, hasta) => api.get(withRango(`${BASE}/visitas`, desde, hasta)),
  visitasPorHora:          (desde, hasta) => api.get(withRango(`${BASE}/visitas-por-hora`, desde, hasta)),
  productosMasVistos:      (desde, hasta, limit = 10) => api.get(withRango(`${BASE}/productos-mas-vistos`, desde, hasta, { limit })),
  vistasPorHoraDeProducto: (id, desde, hasta) => api.get(withRango(`${BASE}/productos/${id}/vistas-por-hora`, desde, hasta)),
  embudoCarrito:           (desde, hasta) => api.get(withRango(`${BASE}/embudo-carrito`, desde, hasta)),
}
