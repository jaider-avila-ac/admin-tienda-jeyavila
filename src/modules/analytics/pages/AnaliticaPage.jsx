import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, Users, UserCheck, UserX } from 'lucide-react'
import { reportService } from '../../../services/reportService'
import { authService } from '../../../services/authService'
import { formatNumber } from '../../../utils/format'

function diaLabel(fecha) {
  return fecha.slice(8, 10) // "2026-09-21" -> "21"
}

// Mini gráfico de barras verticales reutilizado para "visitas por día" y "horarios pico" —
// sin librería externa (el resto del admin tampoco usa ninguna, ver Pedidos por estado en
// ReportsPage), solo divs con altura en porcentaje.
function BarrasVerticales({ datos, valueKey, labelKey, formatLabel = (v) => v }) {
  const max = Math.max(1, ...datos.map((d) => Number(d[valueKey]) || 0))
  return (
    <div className="flex items-end gap-1 h-32">
      {datos.map((d, i) => {
        const val = Number(d[valueKey]) || 0
        const pct = val > 0 ? Math.max(4, Math.round((val / max) * 100)) : 0
        return (
          <div key={i} className="flex-1 min-w-0 flex flex-col items-center gap-1 h-full">
            <div className="w-full flex-1 flex items-end bg-gray-50">
              <div
                className="w-full bg-black transition-all"
                style={{ height: `${pct}%` }}
                title={`${formatLabel(d[labelKey])}: ${formatNumber(val)}`}
              />
            </div>
            <span className="text-[9px] text-gray-400 truncate w-full text-center">
              {formatLabel(d[labelKey])}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function FunnelRow({ label, valor, pct, destacar }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-40 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 h-2.5 overflow-hidden">
        <div
          className={`h-full transition-all ${destacar ? 'bg-admin-accent' : 'bg-black'}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className="text-xs font-bold text-black w-24 text-right flex-shrink-0">
        {formatNumber(valor)} {pct != null && <span className="text-gray-400 font-normal">({pct}%)</span>}
      </span>
    </div>
  )
}

export default function AnaliticaPage() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [resumen, setResumen] = useState(null)
  const [porHora, setPorHora] = useState([])
  const [masVistos, setMasVistos] = useState([])
  const [embudo, setEmbudo] = useState(null)
  const [productoSel, setProductoSel] = useState(null)
  const [horaProducto, setHoraProducto] = useState([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(() => {
    setLoading(true)
    Promise.all([
      reportService.visitasResumen(desde, hasta),
      reportService.visitasPorHora(desde, hasta),
      reportService.productosMasVistos(desde, hasta, 10),
      reportService.embudoCarrito(desde, hasta),
    ])
      .then(([res, hora, productos, emb]) => {
        setResumen(res)
        setPorHora(Array.isArray(hora) ? hora : [])
        setMasVistos(Array.isArray(productos) ? productos : [])
        setEmbudo(emb)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [desde, hasta])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    if (!productoSel) { setHoraProducto([]); return }
    reportService.vistasPorHoraDeProducto(productoSel.producto_id, desde, hasta)
      .then((d) => setHoraProducto(Array.isArray(d) ? d : []))
      .catch(() => setHoraProducto([]))
  }, [productoSel, desde, hasta])

  // Igual que Reportes: solo admin/superadmin, y esto es solo la capa visual — el backend ya
  // exige ROLE_ADMIN en cada endpoint (ver ReporteController), esto solo evita el flash de una
  // página vacía para quien no debería ni intentar entrar.
  if (!['admin', 'superadmin'].includes(authService.getUser()?.rol)) {
    return <Navigate to="/dashboard" replace />
  }

  if (loading) {
    return <div className="py-20 text-center text-sm text-gray-400">Cargando analítica…</div>
  }

  return (
    <div className="space-y-6">
      <div className="section-card px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-black">Periodo</h2>
          <p className="text-xs text-gray-400">Últimos 30 días si no eliges fechas</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="input-field w-auto text-sm" />
          <span className="text-xs text-gray-400">a</span>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="input-field w-auto text-sm" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Visitas totales',         value: formatNumber(resumen?.total_visitas ?? 0),          icon: Eye },
          { label: 'Visitantes únicos',       value: formatNumber(resumen?.visitantes_unicos ?? 0),      icon: Users },
          { label: 'Visitantes registrados',  value: formatNumber(resumen?.visitantes_registrados ?? 0), icon: UserCheck },
          { label: 'Visitantes anónimos',     value: formatNumber(resumen?.visitantes_anonimos ?? 0),    icon: UserX },
        ].map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="section-card p-5 text-center">
              <Icon size={20} className="text-icon-mono mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{kpi.label}</p>
              <p className="text-2xl font-black text-black mt-1">{kpi.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitas por día */}
        <div className="section-card p-5">
          <h2 className="text-sm font-bold text-black mb-4">Visitas por día</h2>
          {resumen?.por_dia?.length > 0 ? (
            <BarrasVerticales datos={resumen.por_dia} valueKey="cantidad" labelKey="fecha" formatLabel={diaLabel} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Sin datos</p>
          )}
        </div>

        {/* Horarios de más tráfico */}
        <div className="section-card p-5">
          <h2 className="text-sm font-bold text-black mb-4">Horarios de más tráfico</h2>
          {porHora.length > 0 ? (
            <BarrasVerticales datos={porHora} valueKey="cantidad" labelKey="hora" formatLabel={(h) => `${h}h`} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Sin datos</p>
          )}
        </div>

        {/* Productos más vistos */}
        <div className="section-card p-5">
          <h2 className="text-sm font-bold text-black mb-4">Productos más vistos</h2>
          {masVistos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin datos disponibles</p>
          ) : (
            <div className="space-y-3">
              {masVistos.map((p, i) => (
                <button
                  key={p.producto_id}
                  onClick={() => setProductoSel(productoSel?.producto_id === p.producto_id ? null : p)}
                  className={`w-full flex items-center gap-3 text-left ${productoSel?.producto_id === p.producto_id ? 'bg-gray-50' : ''}`}
                >
                  <div className={`w-6 h-6 flex items-center justify-center text-xs font-black flex-shrink-0 ${i === 0 ? 'bg-admin-accent text-admin-accent-contrast' : 'bg-gray-100 text-gray-600'}`}>
                    {i + 1}
                  </div>
                  <span className="flex-1 min-w-0 text-xs font-semibold text-black truncate">{p.nombre}</span>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-black">{formatNumber(p.vistas)}</p>
                    <p className="text-xs text-gray-400">vistas</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Horarios de vista del producto seleccionado */}
        <div className="section-card p-5">
          <h2 className="text-sm font-bold text-black mb-4">
            {productoSel ? `Horarios de vista — ${productoSel.nombre}` : 'Horarios de vista por producto'}
          </h2>
          {!productoSel ? (
            <p className="text-sm text-gray-400 text-center py-4">Elige un producto de la lista</p>
          ) : (
            <BarrasVerticales datos={horaProducto} valueKey="cantidad" labelKey="hora" formatLabel={(h) => `${h}h`} />
          )}
        </div>

        {/* Embudo visitante → carrito → pedido */}
        <div className="section-card p-5 lg:col-span-2">
          <h2 className="text-sm font-bold text-black mb-4">Embudo de conversión</h2>
          {!embudo ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin datos</p>
          ) : (
            <div className="space-y-3">
              <FunnelRow label="Visitantes" valor={embudo.visitantes} pct={100} />
              <FunnelRow label="Agregaron al carrito" valor={embudo.agregaron_carrito} pct={embudo.tasa_agregado_carrito} />
              <FunnelRow label="Compraron (pedidos)" valor={embudo.pedidos} pct={embudo.tasa_conversion} destacar />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
