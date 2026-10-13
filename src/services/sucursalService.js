import { api } from './api'

export const sucursalService = {
  list: () => api.get('/sucursales'),
  // Editar una sucursal ya existente. Crear una nueva es exclusivo del superadmin (decisión
  // explícita del usuario, 2026-09-01) — a propósito no hay create acá.
  update: (id, data) => api.put(`/sucursales/${id}`, data),
}
