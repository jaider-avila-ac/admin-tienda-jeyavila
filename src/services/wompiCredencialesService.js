import { api } from './api'

// Credenciales de Wompi de ESTA tienda (ver TiendaWompiController en el backend) — el tenant se
// resuelve del propio JWT del admin, nunca hace falta mandarlo acá.
export const wompiCredencialesService = {
  estado: () => api.get('/tienda/wompi'),
  actualizar: ({ publicKey, privateKey, integrityKey, eventsKey }) =>
    api.put('/tienda/wompi', {
      public_key: publicKey,
      private_key: privateKey,
      integrity_key: integrityKey,
      events_key: eventsKey,
    }),
}
