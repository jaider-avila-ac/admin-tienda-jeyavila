import * as adapter from './adapter'

const STORE = 'promotions'

export const promotionService = {
  getAll: () => adapter.getAll(STORE),
  getById: (id) => adapter.getById(STORE, id),
  create: (data) => adapter.create(STORE, { ...data, usos: 0 }),
  update: (id, data) => adapter.update(STORE, id, data),
  remove: (id) => adapter.remove(STORE, id),
}
