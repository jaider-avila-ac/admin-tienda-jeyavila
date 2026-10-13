import { api } from './api'

const BASE = '/clientes'

export const customerService = {
  getAll: () => api.get(BASE),
  getById: (id) => api.get(`${BASE}/${id}`),
  remove: (id) => api.delete(`${BASE}/${id}`),
}
