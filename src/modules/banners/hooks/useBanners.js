import { useState, useEffect, useCallback } from 'react'
import { bannerService } from '../../../services/bannerService'

export function useBanners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await bannerService.getAll()
      setBanners(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return {
    banners,
    loading,
    error,
    reload: load,
    create: async (data)     => { await bannerService.create(data);     load() },
    update: async (id, data) => { await bannerService.update(id, data); load() },
    remove: async (id)       => { await bannerService.remove(id);       load() },
  }
}
