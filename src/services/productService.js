import { api } from './api'

const BASE = '/productos'

export const productService = {
  getAll: ({ page = 0, size = 20, catId, activo, q } = {}) => {
    const params = new URLSearchParams({ page, size })
    if (catId) params.set('catId', catId)
    if (activo !== undefined && activo !== null) params.set('activo', activo)
    if (q) params.set('q', q)
    return api.get(`${BASE}?${params.toString()}`)
  },
  getById:   (id)   => api.get(`${BASE}/${id}`),
  create:    (data) => api.post(BASE, data),
  update:    (id, data) => api.put(`${BASE}/${id}`, data),
  remove:    (id)   => api.delete(`${BASE}/${id}`),
  impactoEliminacion: (id) => api.get(`${BASE}/${id}/impacto-eliminacion`),
}
