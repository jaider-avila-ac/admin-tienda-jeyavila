import { useState, useEffect, useCallback } from 'react'
import { api } from '../../../services/api'

export function useInventory() {
  const [items,   setItems]   = useState([])
  const [resumen, setResumen] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get('/variantes/inventario')

      setItems(Array.isArray(data?.items) ? data.items : [])
      setResumen(data?.resumen ?? null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const updateStock = async (varId, stock) => {
    await api.patch(`/variantes/${varId}/stock`, { cantidad: Number(stock) })
    load()
  }

  return { items, resumen, loading, error, reload: load, updateStock }
}
