import { useState, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { authService } from '../../services/authService'

export default function ProtectedRoute() {
  // 'checking' mientras verifica el token contra el backend
  // 'ok'       token válido → mostrar contenido
  // 'invalid'  token ausente/expirado → redirigir a login
  const [status, setStatus] = useState(
    authService.isAuthenticated() ? 'checking' : 'invalid'
  )

  useEffect(() => {
    if (status !== 'checking') return
    authService.verify()
      .then(() => setStatus('ok'))
      .catch(() => {
        authService.logout()
        setStatus('invalid')
      })
  }, [])

  if (status === 'invalid') return <Navigate to="/login" replace />

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-7 h-7 border-2 border-black border-t-transparent animate-spin" />
      </div>
    )
  }

  return <Outlet />
}
