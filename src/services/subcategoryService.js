import { api } from './api'

const BASE = '/subcategorias'

export const subcategoryService = {
  getAll:   ()        => api.get(BASE),
  getByCat: (catId)   => api.get(`${BASE}?catId=${catId}`),
  getById:  (id)      => api.get(`${BASE}/${id}`),
  create:   (data)    => api.post(BASE, data),
  update:   (id, data)=> api.put(`${BASE}/${id}`, data),
  remove:   (id)      => api.delete(`${BASE}/${id}`),
  reordenar: (ids)    => api.patch(`${BASE}/reordenar`, ids),
}
