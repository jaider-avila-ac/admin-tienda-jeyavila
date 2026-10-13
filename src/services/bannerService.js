import { api } from './api'

const BASE = '/banners'

export const bannerService = {
  getAll: ()         => api.get(BASE),
  create: (data)      => api.post(BASE, data),
  update: (id, data)  => api.put(`${BASE}/${id}`, data),
  remove: (id)        => api.delete(`${BASE}/${id}`),
}
