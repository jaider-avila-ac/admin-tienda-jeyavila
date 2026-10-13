import { api } from './api'

const BASE = '/direcciones-devolucion'

export const direccionDevolucionService = {
  getAll: () => api.get(BASE),
  create: (data) => api.post(BASE, data),
  update: (id, data) => api.put(`${BASE}/${id}`, data),
  remove: (id) => api.delete(`${BASE}/${id}`),
}
