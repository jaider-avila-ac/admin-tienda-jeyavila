import { api } from './api'

const BASE = '/devoluciones'

export const ESTADOS_DEVOLUCION = ['pendiente', 'aprobada', 'rechazada', 'en_transito', 'recibida', 'cancelada']

export const devolucionService = {
  getAll: (estado) => api.get(estado ? `${BASE}?estado=${estado}` : BASE),
  getById: (id) => api.get(`${BASE}/${id}`),
  aprobar: (id, direccionId, nota) => api.patch(`${BASE}/${id}/aprobar`, { direccion_id: direccionId, nota }),
  rechazar: (id, nota) => api.patch(`${BASE}/${id}/rechazar`, { nota }),
  confirmarRecibida: (id) => api.post(`${BASE}/${id}/confirmar-recibida`),
}
