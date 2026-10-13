import { api } from './api'

const BASE = '/empaques'

export const empaqueService = {
  getAll: () => api.get(BASE),
  create: (data) => api.post(BASE, data),
  update: (id, data) => api.patch(`${BASE}/${id}`, data),
  remove: (id) => api.delete(`${BASE}/${id}`),
}
