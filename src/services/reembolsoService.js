import { api } from './api'

export const reembolsoService = {
  confirmar: (id, estado, nota) =>
    api.patch(`/reembolsos/${id}/confirmar`, { estado, nota }),
}
