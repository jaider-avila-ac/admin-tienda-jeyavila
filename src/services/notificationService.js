import { api } from './api'

export const notificationService = {
  list: () => api.get('/notificaciones'),
  markRead: (id) => api.post(`/notificaciones/${id}/leer`),
  markAllRead: () => api.post('/notificaciones/leer-todas'),
}
