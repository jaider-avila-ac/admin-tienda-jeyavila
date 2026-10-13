import { api } from './api'

export const tiendaConfigService = {
  get: () => api.get('/tienda/config'),
  update: ({ envioModo, envioGratisActivo, envioGratisDesde, envioCosto, dominioStaff, emailNotificacionPedidos, enviaAmbiente }) =>
    api.patch('/tienda/config', {
      envio_modo: envioModo,
      envio_gratis_activo: envioGratisActivo,
      envio_gratis_desde: envioGratisDesde,
      envio_costo: envioCosto,
      dominio_staff: dominioStaff,
      email_notificacion_pedidos: emailNotificacionPedidos,
      // "sandbox" | "produccion" — solo importa si envio_modo="envia" (PLAN_INTEGRACION_ENVIA.md).
      envia_ambiente: enviaAmbiente,
    }),
}
