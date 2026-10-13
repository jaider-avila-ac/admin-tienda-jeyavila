import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Search, User, UserPlus, ShoppingBag } from 'lucide-react'
import { customerService } from '../../../services/customerService'
import { productService } from '../../../services/productService'
import { ventaLocalService } from '../../../services/ventaLocalService'
import Input from '../../../components/ui/Input'

const METODOS = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'NEQUI', label: 'Nequi' },
  { value: 'PSE', label: 'PSE' },
  { value: 'BANCOLOMBIA_TRANSFER', label: 'Transferencia Bancolombia' },
  { value: 'OTRO', label: 'Otro' },
]

function fmt(pesos) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(pesos || 0)
}

export default function LocalSalePage() {
  const navigate = useNavigate()

  const [clienteModo, setClienteModo] = useState('existente') // 'existente' | 'nuevo'
  const [customers, setCustomers] = useState([])
  const [buscarCliente, setBuscarCliente] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [tipoDocumentoNuevo, setTipoDocumentoNuevo] = useState('CC')
  const [numeroDocumentoNuevo, setNumeroDocumentoNuevo] = useState('')

  const [buscarProducto, setBuscarProducto] = useState('')
  const [resultadosProducto, setResultadosProducto] = useState([])
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [varSeleccionada, setVarSeleccionada] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [precioVentaInput, setPrecioVentaInput] = useState('')

  const [items, setItems] = useState([])
  const [quote, setQuote] = useState({ items: [], total: 0, subtotal: 0, descuento: 0 })
  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    customerService.getAll().then((data) => setCustomers(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  useEffect(() => {
    const q = buscarProducto.trim()
    if (q.length < 2) { setResultadosProducto([]); return }
    const timer = setTimeout(() => {
      productService.getAll({ q, size: 8 })
        .then((data) => setResultadosProducto(data?.content ?? []))
        .catch(() => setResultadosProducto([]))
    }, 300)
    return () => clearTimeout(timer)
  }, [buscarProducto])

  useEffect(() => {
    let alive = true
    if (items.length === 0) { setQuote({ items: [], total: 0, subtotal: 0, descuento: 0 }); return () => { alive = false } }
    ventaLocalService.quote(items)
      .then((data) => { if (alive) setQuote(data) })
      .catch((err) => { if (alive) setError(err.message || 'No se pudo cotizar la venta') })
    return () => { alive = false }
  }, [items])

  const clientesFiltrados = customers.filter((c) => {
    const q = buscarCliente.toLowerCase()
    if (!q) return false
    const nombre = `${c.nombre ?? ''} ${c.apellido ?? ''}`.toLowerCase()
    return nombre.includes(q) || (c.email ?? '').toLowerCase().includes(q) || (c.numero_documento ?? '').includes(buscarCliente)
  })

  const seleccionarProducto = async (p) => {
    const detalle = await productService.getById(p.id)
    setProductoSeleccionado(detalle)
    setVarSeleccionada(detalle.variantes?.[0]?.id ?? '')
    setPrecioVentaInput(String(detalle.precio ?? ''))
    setBuscarProducto('')
    setResultadosProducto([])
  }

  const agregarItem = () => {
    if (!productoSeleccionado) return
    const variante = productoSeleccionado.variantes?.find((v) => String(v.id) === String(varSeleccionada))
    if (productoSeleccionado.variantes?.length > 0 && !variante) return
    const precioCatalogo = productoSeleccionado.precio
    const precioVenta = Number(precioVentaInput)
    if (!precioVenta || precioVenta <= 0) { setError('Indica un precio de venta mayor a $0'); return }
    if (precioVenta > precioCatalogo) { setError('El precio de venta no puede ser mayor al de catálogo'); return }
    setError('')
    setItems((prev) => [...prev, {
      prdId: productoSeleccionado.id,
      varId: variante ? variante.id : null,
      nombre: productoSeleccionado.nombre,
      varLabel: variante ? [variante.talla, variante.color].filter(Boolean).join(' / ') : null,
      cantidad: Number(cantidad) || 1,
      // null = se cobra el precio de catálogo tal cual; solo se manda si de verdad quedó distinto
      // (evita mandar un "descuento de $0" que el backend tendría que descartar igual).
      precioVenta: precioVenta && precioVenta !== precioCatalogo ? precioVenta : null,
    }])
    setProductoSeleccionado(null)
    setCantidad(1)
    setPrecioVentaInput('')
  }

  const quitarItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx))

  // Mutex SINCRÓNICO (no useState, cuyo efecto no es inmediato en el siguiente render) más una
  // clave que se genera UNA vez y se conserva entre reintentos: un doble tap en "Registrar venta"
  // (muy común cuando la pantalla tarda un momento en responder) ya no crea dos pedidos, dos pagos
  // aprobados ni descuenta el stock dos veces — ver IdempotenciaGuard en el backend.
  const saleMutexRef = useRef(false)
  const idempotencyKeyRef = useRef(null)

  const handleSubmit = async () => {
    if (saleMutexRef.current) return
    setError('')
    if (items.length === 0) { setError('Agrega al menos un producto'); return }
    if (!quote.total || quote.total <= 0) { setError('El total de la venta debe ser mayor a $0'); return }
    if (clienteModo === 'existente' && !clienteSeleccionado) { setError('Selecciona un cliente'); return }
    if (clienteModo === 'nuevo' && (!nombreNuevo.trim() || !numeroDocumentoNuevo.trim())) {
      setError('Indica el nombre y el número de documento del cliente'); return
    }

    saleMutexRef.current = true
    setSaving(true)
    if (!idempotencyKeyRef.current) idempotencyKeyRef.current = crypto.randomUUID()
    try {
      const payload = clienteModo === 'existente'
        ? { usrId: clienteSeleccionado.id, items, metodoPago, notas, idempotencyKey: idempotencyKeyRef.current }
        : { nombre: nombreNuevo, tipoDocumento: tipoDocumentoNuevo, numeroDocumento: numeroDocumentoNuevo, items, metodoPago, notas, idempotencyKey: idempotencyKeyRef.current }
      const result = await ventaLocalService.create(payload)
      navigate(`/pedidos/${result.pedido_id}`)
      // No se libera el mutex ni se limpia la clave: la página está a punto de navegar fuera.
    } catch (err) {
      setError(err.message || 'No se pudo registrar la venta')
      setSaving(false)
      saleMutexRef.current = false
      // La clave se conserva a propósito: un reintento tras un error debe reusarla, no generar
      // una nueva, para que el backend lo reconozca como la misma intención de venta.
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="page-title">Venta local</h1>
        <p className="page-subtitle">Registra una venta hecha en persona (mostrador), no desde la tienda online.</p>
      </div>

      {/* ── Cliente ── */}
      {/* !overflow-visible: section-card trae overflow-hidden (por las esquinas redondeadas),
          que recortaba la lista de resultados de la búsqueda de cliente. */}
      <div className="section-card p-6 space-y-4 !overflow-visible">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setClienteModo('existente')}
            className={`btn-secondary text-xs ${clienteModo === 'existente' ? 'bg-black text-white' : ''}`}>
            <User size={13} /> Cliente existente
          </button>
          <button
            onClick={() => setClienteModo('nuevo')}
            className={`btn-secondary text-xs ${clienteModo === 'nuevo' ? 'bg-black text-white' : ''}`}>
            <UserPlus size={13} /> Cliente nuevo
          </button>
        </div>

        {clienteModo === 'existente' ? (
          <div>
            {clienteSeleccionado ? (
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-black">
                    {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}
                  </p>
                  <p className="text-xs text-gray-400">{clienteSeleccionado.email || clienteSeleccionado.numero_documento}</p>
                </div>
                <button onClick={() => setClienteSeleccionado(null)} className="btn-secondary text-xs">Cambiar</button>
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="pl-8 input-field text-sm"
                  placeholder="Buscar por nombre, email o documento..."
                  value={buscarCliente}
                  onChange={(e) => setBuscarCliente(e.target.value)}
                />
                {clientesFiltrados.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 shadow-lg max-h-56 overflow-y-auto">
                    {clientesFiltrados.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setClienteSeleccionado(c); setBuscarCliente('') }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0"
                      >
                        <p className="font-semibold text-black">{c.nombre} {c.apellido}</p>
                        <p className="text-xs text-gray-400">{c.email || c.numero_documento || 'Sin datos'}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Nombre completo" value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} />
            <div>
              <label className="label-field">Tipo de documento</label>
              <select value={tipoDocumentoNuevo} onChange={(e) => setTipoDocumentoNuevo(e.target.value)} className="input-field bg-white">
                <option value="CC">Cédula de ciudadanía</option>
                <option value="CE">Cédula de extranjería</option>
                <option value="TI">Tarjeta de identidad</option>
                <option value="PP">Pasaporte</option>
                <option value="NIT">NIT</option>
              </select>
            </div>
            <Input label="Número de documento" value={numeroDocumentoNuevo} onChange={(e) => setNumeroDocumentoNuevo(e.target.value)} />
          </div>
        )}
      </div>

      {/* ── Productos ── */}
      {/* !overflow-visible: mismo motivo que la tarjeta de Cliente, para la lista de resultados
          de la búsqueda de producto. */}
      <div className="section-card p-6 space-y-4 !overflow-visible">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <ShoppingBag size={16} className="text-gray-500" />
          <h2 className="text-sm font-bold text-black">Productos</h2>
        </div>

        {productoSeleccionado ? (
          <div className="bg-gray-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-black">{productoSeleccionado.nombre}</p>
                <p className="text-xs text-gray-500">
                  {fmt(productoSeleccionado.precio)} c/u
                  {productoSeleccionado.precioAntes && (
                    <span className="text-gray-400 line-through ml-1.5">{fmt(productoSeleccionado.precioAntes)}</span>
                  )}
                </p>
              </div>
              <button onClick={() => setProductoSeleccionado(null)} className="text-xs text-gray-400 hover:text-black">Cancelar</button>
            </div>
            {productoSeleccionado.variantes?.length > 0 && (
              <select value={varSeleccionada} onChange={(e) => setVarSeleccionada(e.target.value)} className="input-field bg-white text-sm">
                {productoSeleccionado.variantes.map((v) => (
                  <option key={v.id} value={v.id} disabled={v.stock === 0}>
                    {[v.talla, v.color].filter(Boolean).join(' / ')} — stock: {v.stock}
                  </option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-3">
              <div>
                <label className="label-field !mb-1">Cantidad</label>
                <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
                  className="input-field w-20 text-sm" />
              </div>
              <div>
                <label className="label-field !mb-1">Precio de venta</label>
                <input type="number" min="1" max={productoSeleccionado.precio} value={precioVentaInput}
                  onChange={(e) => setPrecioVentaInput(e.target.value)}
                  className="input-field w-28 text-sm" />
              </div>
              <span className="text-sm font-bold text-black self-end pb-2">
                {fmt((Number(precioVentaInput) || 0) * (Number(cantidad) || 0))}
              </span>
              <button onClick={agregarItem} className="btn-primary text-xs self-end"><Plus size={13} /> Agregar</button>
            </div>
            {Number(precioVentaInput) > 0 && Number(precioVentaInput) < productoSeleccionado.precio && (
              <p className="text-xs text-admin-accent">
                Descuento de {fmt(productoSeleccionado.precio - Number(precioVentaInput))} c/u sobre el precio de catálogo
              </p>
            )}
            {Number(precioVentaInput) > productoSeleccionado.precio && (
              <p className="text-xs text-red-500">El precio de venta no puede ser mayor al de catálogo</p>
            )}
          </div>
        ) : (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="pl-8 input-field text-sm"
              placeholder="Buscar producto por nombre..."
              value={buscarProducto}
              onChange={(e) => setBuscarProducto(e.target.value)}
            />
            {resultadosProducto.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 shadow-lg max-h-56 overflow-y-auto">
                {resultadosProducto.map((p) => (
                  <button key={p.id} onClick={() => seleccionarProducto(p)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0">
                    <p className="font-semibold text-black">{p.nombre}</p>
                    <p className="text-xs text-gray-400">{fmt(p.precio)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {items.length > 0 && (
          <div className="divide-y divide-gray-50 border-t border-gray-100 pt-2">
            {items.map((item, idx) => {
              const priced = quote.items?.[idx]
              return (
              <div key={idx} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-semibold text-black">{item.nombre}</p>
                  <p className="text-xs text-gray-400">
                    {item.varLabel ? `${item.varLabel} · ` : ''}x{item.cantidad} · {fmt(priced?.precio)} c/u
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-sm font-bold text-black">{fmt(priced?.subtotal)}</span>
                    {priced?.descuentoUnitario > 0 && (
                      <p className="text-[11px] text-admin-accent">
                        -{fmt(priced.descuentoUnitario * item.cantidad)} desc.
                      </p>
                    )}
                  </div>
                  <button onClick={() => quitarItem(idx)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              )
            })}
            {quote.descuento > 0 && (
              <div className="flex items-center justify-between pt-3">
                <span className="text-sm text-gray-500">Subtotal (catálogo)</span>
                <span className="text-sm text-gray-500">{fmt(quote.subtotal)}</span>
              </div>
            )}
            {quote.descuento > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-admin-accent font-semibold">Descuento</span>
                <span className="text-sm text-admin-accent font-semibold">-{fmt(quote.descuento)}</span>
              </div>
            )}
            <div className={`flex items-center justify-between ${quote.descuento > 0 ? '' : 'pt-3'}`}>
              <span className="text-sm font-bold text-black">Total</span>
              <span className="text-lg font-black text-black">{fmt(quote.total)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Pago ── */}
      <div className="section-card p-6 space-y-4">
        <div>
          <label className="label-field">Método de pago</label>
          <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="input-field bg-white">
            {METODOS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <Input label="Notas (opcional)" value={notas} onChange={(e) => setNotas(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end">
        <button onClick={handleSubmit} disabled={saving || items.length === 0 || !quote.total} className="btn-primary">
          {saving ? 'Registrando…' : 'Registrar venta'}
        </button>
      </div>
    </div>
  )
}
