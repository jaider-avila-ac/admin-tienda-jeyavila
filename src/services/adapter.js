import productsData      from '../data/products.json'
import categoriesData    from '../data/categories.json'
import subcategoriesData from '../data/subcategories.json'
import ordersData        from '../data/orders.json'
import customersData     from '../data/customers.json'
import promotionsData    from '../data/promotions.json'

const STORES = {
  products:      'jey_avila_music_products',
  categories:    'jey_avila_music_categories',
  subcategories: 'jey_avila_music_subcategories',
  orders:        'jey_avila_music_orders',
  customers:     'jey_avila_music_customers',
  promotions:    'jey_avila_music_promotions',
}

const SEED = {
  products:      productsData,
  categories:    categoriesData,
  subcategories: subcategoriesData,
  orders:        ordersData,
  customers:     customersData,
  promotions:    promotionsData,
}

function ensureSeeded(store) {
  const key = STORES[store]
  if (!key) throw new Error(`Unknown store: ${store}`)
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(SEED[store] ?? []))
  }
}

export function getAll(store) {
  ensureSeeded(store)
  return JSON.parse(localStorage.getItem(STORES[store]) ?? '[]')
}

export function getById(store, id) {
  return getAll(store).find((item) => item.id === Number(id)) ?? null
}

export function create(store, data) {
  const items = getAll(store)
  const maxId = items.reduce((max, i) => Math.max(max, i.id ?? 0), 0)
  const newItem = { ...data, id: maxId + 1 }
  localStorage.setItem(STORES[store], JSON.stringify([...items, newItem]))
  return newItem
}

export function update(store, id, data) {
  const items = getAll(store)
  const updated = items.map((item) =>
    item.id === Number(id) ? { ...item, ...data } : item
  )
  localStorage.setItem(STORES[store], JSON.stringify(updated))
  return updated.find((i) => i.id === Number(id)) ?? null
}

export function remove(store, id) {
  const items = getAll(store).filter((item) => item.id !== Number(id))
  localStorage.setItem(STORES[store], JSON.stringify(items))
}

export function resetStore(store) {
  localStorage.removeItem(STORES[store])
}
