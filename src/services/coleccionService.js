import { api } from './api'

const BASE = '/colecciones'

export const coleccionService = {
  getAll:  ()          => api.get(BASE),
  getById: (id)        => api.get(`${BASE}/${id}`),
  create:  (data)      => api.post(BASE, data),
  update:  (id, data)  => api.put(`${BASE}/${id}`, data),
  remove:  (id)        => api.delete(`${BASE}/${id}`),
  reordenar: (ids)     => api.patch(`${BASE}/reordenar`, ids),
}
