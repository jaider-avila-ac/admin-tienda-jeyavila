import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, ShoppingBag, AlertTriangle, CheckCircle2, MessageCircleQuestion } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'

function rutaPara(n) {
  if (n.entidad_tipo === 'pedido' && n.entidad_id) return `/pedidos/${n.entidad_id}`
  // La pregunta se abre desde el listado (no hay ruta de detalle propia) — igual navega para
  // que el admin la vea en contexto, en vez de dejar la notificación sin ningún destino.
  if (n.entidad_tipo === 'pregunta') return '/preguntas'
  return null
}

const TIPO_META = {
  pedido_nuevo:          { Icon: ShoppingBag,           className: 'text-black' },
  alerta_stock:          { Icon: AlertTriangle,         className: 'text-red-600' },
  alerta_stock_resuelta: { Icon: CheckCircle2,          className: 'text-admin-accent' },
  pregunta_nueva:        { Icon: MessageCircleQuestion, className: 'text-black' },
  otro:                  { Icon: Bell,                  className: 'text-gray-600' },
}

function tiempoRelativo(str) {
  if (!str) return ''
  // Backend envía "dd/MM/yyyy HH:mm" en zona Bogotá
  const [datePart, timePart] = str.split(' ')
  const [day, month, year] = datePart.split('/').map(Number)
  const [hour, minute] = (timePart ?? '0:0').split(':').map(Number)
  const date = new Date(year, month - 1, day, hour, minute)

  const diff = Date.now() - date.getTime()
  const min = Math.floor(diff / 60000)
  const hr = Math.floor(diff / 3600000)
  const dayDiff = Math.floor(diff / 86400000)
  if (min < 1) return 'Justo ahora'
  if (min < 60) return `hace ${min} min`
  if (hr < 24) return `hace ${hr} h`
  if (dayDiff < 7) return `hace ${dayDiff} ${dayDiff === 1 ? 'día' : 'días'}`
  return str
}

export default function NotificationBell() {
  const { items, unreadCount, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  const handleClick = (n) => {
    if (!n.leida) markRead(n.id)
    const ruta = rutaPara(n)
    if (ruta) {
      setOpen(false)
      navigate(ruta)
    }
  }

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 hover:bg-gray-50 transition-colors"
      >
        <Bell size={18} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-gray-100 shadow-xl z-30">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white">
            <span className="text-sm font-black text-black">Notificaciones</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-black hover:underline"
              >
                <CheckCheck size={12} /> Marcar todas
              </button>
            )}
          </div>

          {items.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">Sin notificaciones</p>
          )}

          {items.map((n) => {
            const { Icon, className } = TIPO_META[n.tipo] ?? TIPO_META.otro
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${n.leida ? '' : 'bg-gray-50/60'}`}
              >
                <Icon size={16} className={`flex-shrink-0 mt-0.5 ${className}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-snug ${n.leida ? 'font-medium text-gray-700' : 'font-bold text-black'}`}>
                    {n.titulo}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.mensaje}</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">{tiempoRelativo(n.creado_en)}</span>
                </div>
                {!n.leida && <span className="w-2 h-2 bg-black flex-shrink-0 mt-1.5" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
