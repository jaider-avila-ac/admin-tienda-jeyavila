import { useState, useEffect, useCallback } from 'react'
import { customerService } from '../../../services/customerService'

export function useCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await customerService.getAll()
      setCustomers(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return {
    customers, loading, error, reload: load,
    remove: async (id) => { await customerService.remove(id); load() },
  }
}
