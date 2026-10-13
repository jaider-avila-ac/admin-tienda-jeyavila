import { useState, useEffect, useCallback } from 'react'
import { productService } from '../../../services/productService'
import { getCached, setCached } from '../../../utils/queryCache'

const EMPTY = { content: [], page: 0, size: 20, total_elements: 0, total_pages: 0 }

export function useProducts({ page = 0, size = 20, catId, activo, q } = {}) {
  const cacheKey = `productos:${JSON.stringify({ page, size, catId, activo, q })}`

  const [result, setResult] = useState(() => getCached(cacheKey) ?? EMPTY)
  const [loading, setLoading] = useState(() => getCached(cacheKey) === undefined)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    const cached = getCached(cacheKey)
    if (cached !== undefined) {
      // Ya hay datos de una visita anterior: se muestran de inmediato
      // y se refresca en segundo plano, sin bloquear la vista.
      setResult(cached)
      setLoading(false)
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)
    try {
      const data = await productService.getAll({ page, size, catId, activo, q })
      const value = data ?? EMPTY
      setCached(cacheKey, value)
      setResult(value)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [cacheKey, page, size, catId, activo, q])

  useEffect(() => { load() }, [load])

  return {
    products: result.content,
    page: result.page,
    totalPages: result.total_pages,
    totalElements: result.total_elements,
    loading, refreshing, error, reload: load,
    create: async (data) => { await productService.create(data); load() },
    update: async (id, data) => { await productService.update(id, data); load() },
    remove: async (id) => { await productService.remove(id); load() },
  }
}
