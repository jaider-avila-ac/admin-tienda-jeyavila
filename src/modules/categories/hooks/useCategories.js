import { useState, useEffect, useCallback } from 'react'
import { categoryService } from '../../../services/categoryService'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await categoryService.getAll()
      setCategories(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return {
    categories,
    loading,
    error,
    reload: load,
    create: async (data)      => { await categoryService.create(data);      load() },
    update: async (id, data)  => { await categoryService.update(id, data);  load() },
    remove: async (id)        => { await categoryService.remove(id);        load() },
  }
}
