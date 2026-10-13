import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { authService } from '../../../services/authService'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm]           = useState({ email: '', password: '' })
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handle = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.login(form.email, form.password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logos/logo-negro.png" alt="Jey Avila Music" width="800" height="334" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-xl font-black text-black">Panel de la tienda</h1>
          <p className="text-sm text-gray-400 mt-1">Ingresa tus credenciales para continuar</p>
        </div>

        {/* Card */}
        <div className="bg-white shadow-lg shadow-black/5 border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-field">Correo electrónico</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={handle('email')}
                  placeholder="correo@ejemplo.com"
                  required
                  autoFocus
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label-field">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handle('password')}
                  placeholder="••••••••"
                  required
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 px-4 py-3">
                <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" />Ingresando…</> : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">Jey Avila Music © {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
