import { api } from './api'

export const ventaLocalService = {
  quote: (items) => api.post('/ventas-locales/cotizacion', {
    items: items.map((i) => ({ prd_id: i.prdId, var_id: i.varId, cantidad: i.cantidad, precio_venta: i.precioVenta ?? null })),
  }),
  create: ({ usrId, nombre, tipoDocumento, numeroDocumento, items, metodoPago, notas, idempotencyKey }) =>
    api.post('/ventas-locales', {
      usr_id: usrId,
      nombre,
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento,
      items: items.map((i) => ({ prd_id: i.prdId, var_id: i.varId, cantidad: i.cantidad, precio_venta: i.precioVenta ?? null })),
      metodo_pago: metodoPago,
      notas,
    }, { 'Idempotency-Key': idempotencyKey }),
}
