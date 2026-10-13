import { api } from './api'

const BASE = '/preguntas'

export const preguntaService = {
  list:      (estado, prdId) => {
    const params = new URLSearchParams()
    if (estado) params.set('estado', estado)
    if (prdId) params.set('prdId', prdId)
    const qs = params.toString()
    return api.get(qs ? `${BASE}?${qs}` : BASE)
  },
  historial: (id)            => api.get(`${BASE}/${id}/historial`),
  responder: (id, texto)     => api.put(`${BASE}/${id}/responder`, { texto }),
  eliminar:  (id)            => api.delete(`${BASE}/${id}`),
}
