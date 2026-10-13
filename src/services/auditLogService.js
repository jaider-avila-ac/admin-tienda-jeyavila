import { api } from './api'

export const auditLogService = {
  list: ({ page = 0, size = 20, entidad } = {}) => {
    const params = new URLSearchParams({ page, size })
    if (entidad) params.set('entidad', entidad)
    return api.get(`/auditoria?${params.toString()}`)
  },
}
