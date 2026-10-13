import { authService } from './authService'

const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/v1`
// Número de la tienda Jey Avila Music en el backend multi-tienda (ver .env). Con sesión iniciada
// debe coincidir con la tienda del token, o el backend responde 403.
const TND = import.meta.env.VITE_TENANT_ID

async function request(path, options = {}) {
  const token = authService.getToken()
  const isFormData = options.body instanceof FormData
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    'X-Tenant-Id': TND,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    authService.logout()
    window.location.href = '/login'
    return
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? err.message ?? `Error ${res.status}`)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  get:    (path)                 => request(path),
  post:   (path, body, headers)  => request(path, { method: 'POST',   body: JSON.stringify(body), headers }),
  put:    (path, body)           => request(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (path, body)           => request(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (path)                 => request(path, { method: 'DELETE' }),
  upload: (path, formData)       => request(path, { method: 'POST', body: formData }),
}
