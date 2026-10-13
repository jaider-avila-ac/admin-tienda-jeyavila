import { useState, useEffect, useCallback } from 'react'
import { orderService } from '../../../services/orderService'

export function useOrders() {
  const [orders,  setOrders]  = useState([])
  const [counts, setCounts] = useState({ total: 0 })
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [data, backendCounts] = await Promise.all([orderService.getAll(), orderService.getCounts()])
      setOrders(Array.isArray(data) ? data : [])
      setCounts(backendCounts ?? { total: 0 })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const resolverAlertaStock = async (id) => {
    await orderService.resolverAlertaStock(id)
    load()
  }

  return { orders, counts, loading, error, reload: load, resolverAlertaStock }
}
