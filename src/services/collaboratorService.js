import { api } from './api'

export const collaboratorService = {
  list: () => api.get('/admin-users'),
  create: ({ usuario, password, nombre, rol, sucursalId, apellido, telefono, tipoDocumento, numeroDocumento, fechaNacimiento }) =>
    api.post('/admin-users', {
      usuario, password, nombre, rol, sucursal_id: sucursalId,
      apellido, telefono,
      tipo_documento: tipoDocumento, numero_documento: numeroDocumento, fecha_nacimiento: fechaNacimiento,
    }),
  update: (id, { nombre, sucursalId, apellido, telefono, tipoDocumento, numeroDocumento, fechaNacimiento, password, usuario }) =>
    api.patch(`/admin-users/${id}`, {
      nombre, sucursal_id: sucursalId, apellido, telefono,
      tipo_documento: tipoDocumento, numero_documento: numeroDocumento, fecha_nacimiento: fechaNacimiento,
      // vacíos = no se tocan (ver AdminUserService.actualizar)
      password: password || null,
      usuario: usuario || null,
    }),
  setActivo: (id, activo) => api.patch(`/admin-users/${id}/activo`, { activo }),
}
