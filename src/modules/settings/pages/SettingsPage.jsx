import { useEffect, useState } from 'react'
import { CreditCard, Mail, Moon, Package, Pencil, Plus, Save, Store, Sun, Phone, MapPin, Trash2, Truck, Undo2 } from 'lucide-react'
import Input from '../../../components/ui/Input'
import { getTheme, setTheme as saveTheme } from '../../../services/themeService'
import { tiendaConfigService } from '../../../services/tiendaConfigService'
import { wompiCredencialesService } from '../../../services/wompiCredencialesService'
import { direccionDevolucionService } from '../../../services/direccionDevolucionService'
import { empaqueService } from '../../../services/empaqueService'
import { sucursalService } from '../../../services/sucursalService'
import { transportadoraService } from '../../../services/transportadoraService'
import { authService } from '../../../services/authService'

const DIRECCION_DEVOLUCION_VACIA = {
  nombre: '', direccion: '', complemento: '', departamento: '', municipio: '', barrio: '',
  contactoNombre: '', contactoTelefono: '',
}

function DireccionesDevolucionSection() {
  const [direcciones, setDirecciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null) // id, o 'nueva'
  const [form, setForm] = useState(DIRECCION_DEVOLUCION_VACIA)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    direccionDevolucionService.getAll()
      .then((data) => setDirecciones(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const iniciarEdicion = (dir) => {
    setForm(dir ? {
      nombre: dir.nombre, direccion: dir.direccion, complemento: dir.complemento ?? '',
      departamento: dir.departamento, municipio: dir.municipio, barrio: dir.barrio ?? '',
      contactoNombre: dir.contacto_nombre ?? '', contactoTelefono: dir.contacto_telefono ?? '',
    } : DIRECCION_DEVOLUCION_VACIA)
    setEditando(dir ? dir.id : 'nueva')
    setError('')
  }

  const guardar = async () => {
    if (!form.nombre.trim() || !form.direccion.trim() || !form.departamento.trim() || !form.municipio.trim()) {
      setError('Nombre, dirección, departamento y municipio son obligatorios')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editando === 'nueva') {
        await direccionDevolucionService.create(form)
      } else {
        await direccionDevolucionService.update(editando, form)
      }
      setEditando(null)
      load()
    } catch (err) {
      setError(err.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const toggleActivo = async (dir) => {
    try {
      await direccionDevolucionService.update(dir.id, { activo: !dir.activo })
      load()
    } catch (err) {
      setError(err.message || 'No se pudo actualizar')
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta dirección de devolución?')) return
    try {
      await direccionDevolucionService.remove(id)
      load()
    } catch (err) {
      setError(err.message || 'No se pudo eliminar')
    }
  }

  return (
    <div className="section-card p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-gray-500" />
          <h2 className="text-sm font-bold text-black">Direcciones de devolución</h2>
        </div>
        {editando === null && (
          <button type="button" onClick={() => iniciarEdicion(null)} className="btn-secondary text-xs">
            <Plus size={13} /> Agregar
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 -mt-2">
        A dónde le indicas al cliente que envíe un producto cuando apruebas su devolución. Puedes tener varias (ej. distintas sedes/bodegas).
      </p>

      {loading ? (
        <p className="text-xs text-gray-400">Cargando...</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {direcciones.map((dir) => (
            <div key={dir.id} className="py-3">
              {editando === dir.id ? (
                <DireccionDevolucionForm form={form} set={set} error={error} saving={saving}
                  onGuardar={guardar} onCancelar={() => setEditando(null)} />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className={dir.activo ? '' : 'opacity-50'}>
                    <p className="text-sm font-semibold text-black">{dir.nombre}</p>
                    <p className="text-xs text-gray-500">{dir.direccion}{dir.complemento ? `, ${dir.complemento}` : ''}</p>
                    <p className="text-xs text-gray-400">{[dir.barrio, dir.municipio, dir.departamento].filter(Boolean).join(', ')}</p>
                    {!dir.activo && <p className="text-xs text-red-500 mt-0.5">Inactiva</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button type="button" onClick={() => toggleActivo(dir)} className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-black" title={dir.activo ? 'Desactivar' : 'Activar'}>
                      <Undo2 size={14} />
                    </button>
                    <button type="button" onClick={() => iniciarEdicion(dir)} className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-black" title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button type="button" onClick={() => eliminar(dir.id)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600" title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {editando === 'nueva' && (
            <div className="py-3">
              <DireccionDevolucionForm form={form} set={set} error={error} saving={saving}
                onGuardar={guardar} onCancelar={() => setEditando(null)} />
            </div>
          )}
          {direcciones.length === 0 && editando === null && (
            <p className="text-xs text-gray-400 py-2">Aún no has agregado ninguna dirección de devolución.</p>
          )}
        </div>
      )}
    </div>
  )
}

function DireccionDevolucionForm({ form, set, error, saving, onGuardar, onCancelar }) {
  return (
    <div className="space-y-3 bg-gray-50 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Nombre (ej. Bodega principal)" value={form.nombre} onChange={set('nombre')} />
        <Input label="Dirección" value={form.direccion} onChange={set('direccion')} />
        <Input label="Complemento (opcional)" value={form.complemento} onChange={set('complemento')} />
        <Input label="Barrio (opcional)" value={form.barrio} onChange={set('barrio')} />
        <Input label="Departamento" value={form.departamento} onChange={set('departamento')} />
        <Input label="Municipio" value={form.municipio} onChange={set('municipio')} />
        <Input label="Nombre de contacto (opcional)" value={form.contactoNombre} onChange={set('contactoNombre')} />
        <Input label="Teléfono de contacto (opcional)" value={form.contactoTelefono} onChange={set('contactoTelefono')} />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex items-center gap-2">
        <button type="button" onClick={onGuardar} disabled={saving} className="btn-primary text-xs">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" onClick={onCancelar} className="text-xs text-gray-400 hover:text-black">Cancelar</button>
      </div>
    </div>
  )
}

const EMPAQUE_VACIO = {
  nombre: '', largoCm: '', anchoCm: '', altoCm: '', pesoGramos: '', orden: '',
}

function EmpaquesSection({ isAdmin }) {
  const [empaques, setEmpaques] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null) // id, o 'nueva'
  const [form, setForm] = useState(EMPAQUE_VACIO)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    empaqueService.getAll()
      .then((data) => setEmpaques(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const iniciarEdicion = (emp) => {
    setForm(emp ? {
      nombre: emp.nombre,
      largoCm: String(emp.largo_cm ?? ''),
      anchoCm: String(emp.ancho_cm ?? ''),
      altoCm: String(emp.alto_cm ?? ''),
      pesoGramos: String(emp.peso_gramos ?? ''),
      orden: String(emp.orden ?? ''),
    } : EMPAQUE_VACIO)
    setEditando(emp ? emp.id : 'nueva')
    setError('')
  }

  const guardar = async () => {
    if (!form.nombre.trim() || !form.largoCm || !form.anchoCm || !form.altoCm || !form.pesoGramos) {
      setError('Nombre, dimensiones y peso son obligatorios')
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      nombre: form.nombre.trim(),
      largo_cm: Number(form.largoCm),
      ancho_cm: Number(form.anchoCm),
      alto_cm: Number(form.altoCm),
      peso_gramos: Number(form.pesoGramos),
      orden: form.orden ? Number(form.orden) : null,
    }
    try {
      if (editando === 'nueva') {
        await empaqueService.create(payload)
      } else {
        await empaqueService.update(editando, payload)
      }
      setEditando(null)
      load()
    } catch (err) {
      setError(err.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const toggleActivo = async (emp) => {
    try {
      await empaqueService.update(emp.id, { activo: !emp.activo })
      load()
    } catch (err) {
      setError(err.message || 'No se pudo actualizar')
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este empaque? Si algún producto lo tiene asignado, tendrás que asignarle otro.')) return
    try {
      await empaqueService.remove(id)
      load()
    } catch (err) {
      setError(err.message || 'No se pudo eliminar')
    }
  }

  return (
    <div className="section-card p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-gray-500" />
          <h2 className="text-sm font-bold text-black">Empaques (cajas)</h2>
        </div>
        {isAdmin && editando === null && (
          <button type="button" onClick={() => iniciarEdicion(null)} className="btn-secondary text-xs">
            <Plus size={13} /> Agregar
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 -mt-2">
        Las cajas o bolsas que usas para empacar. Cada producto debe tener un empaque asignado para
        que la tienda pueda cotizar el envío real (Envia.com) — configúralo desde el formulario del
        producto. El peso y las medidas son las del paquete YA armado (caja + lo que va adentro),
        no las de la caja sola — eso es justo lo que se le manda a la transportadora.
        {!isAdmin && ' Solo el administrador puede crear, editar o eliminar empaques.'}
      </p>

      {loading ? (
        <p className="text-xs text-gray-400">Cargando...</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {empaques.map((emp) => (
            <div key={emp.id} className="py-3">
              {isAdmin && editando === emp.id ? (
                <EmpaqueForm form={form} set={set} error={error} saving={saving}
                  onGuardar={guardar} onCancelar={() => setEditando(null)} />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className={emp.activo ? '' : 'opacity-50'}>
                    <p className="text-sm font-semibold text-black">{emp.nombre}</p>
                    <p className="text-xs text-gray-500">
                      {emp.largo_cm} × {emp.ancho_cm} × {emp.alto_cm} cm — {emp.peso_gramos} g
                    </p>
                    {!emp.activo && <p className="text-xs text-red-500 mt-0.5">Inactivo</p>}
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button type="button" onClick={() => toggleActivo(emp)} className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-black" title={emp.activo ? 'Desactivar' : 'Activar'}>
                        <Undo2 size={14} />
                      </button>
                      <button type="button" onClick={() => iniciarEdicion(emp)} className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-black" title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button type="button" onClick={() => eliminar(emp.id)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600" title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {isAdmin && editando === 'nueva' && (
            <div className="py-3">
              <EmpaqueForm form={form} set={set} error={error} saving={saving}
                onGuardar={guardar} onCancelar={() => setEditando(null)} />
            </div>
          )}
          {empaques.length === 0 && editando === null && (
            <p className="text-xs text-gray-400 py-2">Aún no has agregado ningún empaque.</p>
          )}
        </div>
      )}
    </div>
  )
}

function EmpaqueForm({ form, set, error, saving, onGuardar, onCancelar }) {
  return (
    <div className="space-y-3 bg-gray-50 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Nombre (ej. Caja mediana)" value={form.nombre} onChange={set('nombre')} />
        <Input label="Orden (opcional, menor = primero)" type="number" value={form.orden} onChange={set('orden')} />
        <Input label="Largo (cm)" type="number" value={form.largoCm} onChange={set('largoCm')} />
        <Input label="Ancho (cm)" type="number" value={form.anchoCm} onChange={set('anchoCm')} />
        <Input label="Alto (cm)" type="number" value={form.altoCm} onChange={set('altoCm')} />
        <Input label="Peso total ya empacado (gramos)" type="number" value={form.pesoGramos} onChange={set('pesoGramos')} />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex items-center gap-2">
        <button type="button" onClick={onGuardar} disabled={saving} className="btn-primary text-xs">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" onClick={onCancelar} className="text-xs text-gray-400 hover:text-black">Cancelar</button>
      </div>
    </div>
  )
}

const CAMPOS_WOMPI = [
  { key: 'publicKey', campo: 'PUBLIC_KEY', label: 'Llave pública' },
  { key: 'privateKey', campo: 'PRIVATE_KEY', label: 'Llave privada' },
  { key: 'integrityKey', campo: 'INTEGRITY_KEY', label: 'Llave de integridad' },
  { key: 'eventsKey', campo: 'EVENTS_KEY', label: 'Llave de eventos' },
]
const WOMPI_VACIO = { publicKey: '', privateKey: '', integrityKey: '', eventsKey: '' }

function formatFechaCorta(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Credenciales de Wompi de ESTA tienda (decisión explícita del usuario, 2026-10-15): a
 *  diferencia de las demás integraciones, Wompi la carga el propio admin porque la cuenta es
 *  suya, no de la plataforma — el superadmin también puede seguir editándola desde su panel. Los
 *  campos siempre arrancan vacíos (el backend nunca devuelve el valor real) — dejar uno en
 *  blanco al guardar conserva lo que ya había. */
function WompiSection({ isAdmin }) {
  const [estado, setEstado] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(WOMPI_VACIO)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = () => {
    setLoading(true)
    wompiCredencialesService.estado()
      .then((data) => setEstado(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const estadoDe = (campo) => estado.find((e) => e.campo === campo)
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const guardar = async () => {
    setSaving(true)
    setError('')
    try {
      await wompiCredencialesService.actualizar(form)
      setForm(WOMPI_VACIO)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      load()
    } catch (err) {
      setError(err.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="section-card p-6 space-y-4">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <CreditCard size={16} className="text-gray-500" />
        <h2 className="text-sm font-bold text-black">Credenciales de Wompi</h2>
      </div>
      <p className="text-xs text-gray-400 -mt-2">
        Las llaves de tu propia cuenta de Wompi (dashboard.wompi.co → Configuración → Llaves de
        API / Llave de eventos). Deja en blanco cualquier campo que no quieras cambiar — se
        conserva el valor que ya tenías guardado.
        {!isAdmin && ' Solo el administrador puede verlas y editarlas.'}
      </p>

      {!isAdmin ? null : loading ? (
        <p className="text-xs text-gray-400">Cargando...</p>
      ) : (
        <div className="space-y-3">
          {CAMPOS_WOMPI.map(({ key, campo, label }) => {
            const info = estadoDe(campo)
            return (
              <div key={key}>
                <Input
                  label={label}
                  type="password"
                  value={form[key]}
                  onChange={set(key)}
                  placeholder={info?.configurada ? 'Ya configurada — escribe para cambiarla' : 'Sin configurar'}
                />
                {info?.configurada && (
                  <p className="text-xs text-gray-400 mt-1">
                    Configurada{info.actualizado_por_email ? ` por ${info.actualizado_por_email}` : ''}
                    {info.actualizado_en ? ` el ${formatFechaCorta(info.actualizado_en)}` : ''}
                    {info.origen === 'ENV' ? ' (variable de entorno del servidor)' : ''}
                  </p>
                )}
              </div>
            )
          })}
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex items-center gap-2 pt-1">
            <button type="button" onClick={guardar} disabled={saving} className={`btn-primary text-xs ${saved ? 'bg-admin-accent hover:bg-admin-accent-hover text-admin-accent-contrast' : ''}`}>
              {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar credenciales de Wompi'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const CARRIERS_INFO = [
  { value: 'servientrega', label: 'Servientrega' },
  { value: 'coordinadora', label: 'Coordinadora' },
  { value: 'interrapidisimo', label: 'Interrapidísimo' },
  { value: 'envia', label: 'Envía' },
]
const carrierLabel = (carrier) => CARRIERS_INFO.find((c) => c.value === carrier)?.label ?? carrier

function TransportadorasSection({ isAdmin }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [agregando, setAgregando] = useState(false)
  const [nuevoCarrier, setNuevoCarrier] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    transportadoraService.getAll()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const disponibles = CARRIERS_INFO.filter((c) => !items.some((i) => i.carrier === c.value))

  const agregar = async () => {
    if (!nuevoCarrier) return
    setSaving(true)
    setError('')
    try {
      const maxOrden = Math.max(0, ...items.map((i) => i.orden ?? 0))
      await transportadoraService.create({ carrier: nuevoCarrier, orden: maxOrden + 1 })
      setAgregando(false)
      setNuevoCarrier('')
      load()
    } catch (err) {
      setError(err.message || 'No se pudo agregar')
    } finally {
      setSaving(false)
    }
  }

  const cambiarOrden = async (item, orden) => {
    try {
      await transportadoraService.update(item.id, { orden: Number(orden) })
      load()
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el orden')
    }
  }

  const toggleActivo = async (item) => {
    try {
      await transportadoraService.update(item.id, { activo: !item.activo })
      load()
    } catch (err) {
      setError(err.message || 'No se pudo actualizar')
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Quitar esta transportadora de la lista?')) return
    try {
      await transportadoraService.remove(id)
      load()
    } catch (err) {
      setError(err.message || 'No se pudo eliminar')
    }
  }

  return (
    <div className="section-card p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <Truck size={16} className="text-gray-500" />
          <h2 className="text-sm font-bold text-black">Orden de transportadoras</h2>
        </div>
        {isAdmin && !agregando && disponibles.length > 0 && (
          <button type="button" onClick={() => setAgregando(true)} className="btn-secondary text-xs">
            <Plus size={13} /> Agregar
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 -mt-2">
        Al cotizar con Envia.com, si varias transportadoras devuelven un precio similar se
        prefiere la de menor número de orden. Actívalas y ordénalas según lo que prefieras.
        {!isAdmin && ' Solo el administrador puede editarlas.'}
      </p>

      {loading ? (
        <p className="text-xs text-gray-400">Cargando...</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {items.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between gap-3">
              <div className={item.activo ? '' : 'opacity-50'}>
                <p className="text-sm font-semibold text-black">{carrierLabel(item.carrier)}</p>
                {!item.activo && <p className="text-xs text-red-500 mt-0.5">Inactiva</p>}
              </div>
              {isAdmin ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <input type="number" defaultValue={item.orden} min={0}
                    onBlur={(e) => e.target.value !== String(item.orden) && cambiarOrden(item, e.target.value)}
                    className="input-field w-16 text-sm text-center" title="Orden" />
                  <button type="button" onClick={() => toggleActivo(item)} className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-black" title={item.activo ? 'Desactivar' : 'Activar'}>
                    <Undo2 size={14} />
                  </button>
                  <button type="button" onClick={() => eliminar(item.id)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600" title="Quitar">
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <span className="text-xs text-gray-400 flex-shrink-0">Orden: {item.orden}</span>
              )}
            </div>
          ))}
          {isAdmin && agregando && (
            <div className="py-3 space-y-3">
              <select value={nuevoCarrier} onChange={(e) => setNuevoCarrier(e.target.value)} className="input-field bg-white text-sm">
                <option value="">Seleccionar transportadora...</option>
                {disponibles.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <button type="button" onClick={agregar} disabled={saving || !nuevoCarrier} className="btn-primary text-xs">
                  {saving ? 'Agregando...' : 'Agregar'}
                </button>
                <button type="button" onClick={() => { setAgregando(false); setNuevoCarrier(''); setError('') }} className="text-xs text-gray-400 hover:text-black">Cancelar</button>
              </div>
            </div>
          )}
          {items.length === 0 && !agregando && (
            <p className="text-xs text-gray-400 py-2">Sin transportadoras configuradas — se usará un orden por defecto.</p>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

const SUCURSAL_ORIGEN_VACIO = {
  nombre: '', whatsapp: '',
  envioOrigenNombre: '', envioOrigenTelefono: '', envioOrigenDireccion: '', envioOrigenComplemento: '',
  envioOrigenDepartamento: '', envioOrigenMunicipio: '', envioOrigenCodigoPostal: '',
}

function SucursalesSection({ isAdmin }) {
  const [sucursales, setSucursales] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null) // id
  const [form, setForm] = useState(SUCURSAL_ORIGEN_VACIO)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    sucursalService.list()
      .then((data) => setSucursales(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const iniciarEdicion = (s) => {
    setForm({
      nombre: s.nombre ?? '',
      whatsapp: s.whatsapp ?? '',
      envioOrigenNombre: s.envio_origen_nombre ?? '',
      envioOrigenTelefono: s.envio_origen_telefono ?? '',
      envioOrigenDireccion: s.envio_origen_direccion ?? '',
      envioOrigenComplemento: s.envio_origen_complemento ?? '',
      envioOrigenDepartamento: s.envio_origen_departamento ?? '',
      envioOrigenMunicipio: s.envio_origen_municipio ?? '',
      envioOrigenCodigoPostal: s.envio_origen_codigo_postal ?? '',
    })
    setEditando(s.id)
    setError('')
  }

  const guardar = async () => {
    setSaving(true)
    setError('')
    try {
      await sucursalService.update(editando, {
        nombre: form.nombre.trim() || null,
        whatsapp: form.whatsapp,
        envio_origen_nombre: form.envioOrigenNombre,
        envio_origen_telefono: form.envioOrigenTelefono,
        envio_origen_direccion: form.envioOrigenDireccion,
        envio_origen_complemento: form.envioOrigenComplemento,
        envio_origen_departamento: form.envioOrigenDepartamento,
        envio_origen_municipio: form.envioOrigenMunicipio,
        envio_origen_codigo_postal: form.envioOrigenCodigoPostal,
      })
      setEditando(null)
      load()
    } catch (err) {
      setError(err.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="section-card p-6 space-y-4">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <Store size={16} className="text-gray-500" />
        <h2 className="text-sm font-bold text-black">Sucursales</h2>
      </div>
      <p className="text-xs text-gray-400 -mt-2">
        Dirección de origen desde la que se recoge cada envío real (Envia.com). Crear una
        sucursal nueva es exclusivo del superadmin — aquí solo editas las que ya existen.
        {!isAdmin && ' Solo el administrador puede editarlas.'}
      </p>

      {loading ? (
        <p className="text-xs text-gray-400">Cargando...</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {sucursales.map((s) => (
            <div key={s.id} className="py-3">
              {isAdmin && editando === s.id ? (
                <div className="space-y-3 bg-gray-50 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label="Nombre de la sucursal" value={form.nombre} onChange={set('nombre')} />
                    <Input label="WhatsApp (opcional)" value={form.whatsapp} onChange={set('whatsapp')} />
                  </div>
                  <p className="text-xs font-bold text-black pt-2 border-t border-gray-100">Origen para envío real</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label="Nombre de contacto" value={form.envioOrigenNombre} onChange={set('envioOrigenNombre')} />
                    <Input label="Teléfono de contacto" value={form.envioOrigenTelefono} onChange={set('envioOrigenTelefono')} />
                    <Input label="Dirección" value={form.envioOrigenDireccion} onChange={set('envioOrigenDireccion')} />
                    <Input label="Complemento (opcional)" value={form.envioOrigenComplemento} onChange={set('envioOrigenComplemento')} />
                    <Input label="Departamento" value={form.envioOrigenDepartamento} onChange={set('envioOrigenDepartamento')} />
                    <Input label="Municipio" value={form.envioOrigenMunicipio} onChange={set('envioOrigenMunicipio')} />
                    <Input label="Código postal" value={form.envioOrigenCodigoPostal} onChange={set('envioOrigenCodigoPostal')} />
                  </div>
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={guardar} disabled={saving} className="btn-primary text-xs">
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button type="button" onClick={() => setEditando(null)} className="text-xs text-gray-400 hover:text-black">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-black">{s.nombre}</p>
                    {s.envio_origen_direccion ? (
                      <p className="text-xs text-gray-500">
                        {s.envio_origen_direccion}, {[s.envio_origen_municipio, s.envio_origen_departamento].filter(Boolean).join(', ')}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 mt-0.5">Sin dirección de origen — no se podrá cotizar envío real desde aquí</p>
                    )}
                  </div>
                  {isAdmin && (
                    <button type="button" onClick={() => iniciarEdicion(s)} className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-black flex-shrink-0" title="Editar">
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          {sucursales.length === 0 && (
            <p className="text-xs text-gray-400 py-2">No hay sucursales configuradas.</p>
          )}
        </div>
      )}
    </div>
  )
}

const INITIAL = {
  nombre: 'Jey Avila Music',
  nit: '',
  email: '',
  telefono: '',
  ciudad: '',
  direccion: '',
  sitioWeb: '',
  moneda: 'COP',
  whatsapp: '3025680189',
}

export default function SettingsPage() {
  const [form, setForm] = useState(INITIAL)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [theme, setTheme] = useState(() => getTheme())

  // PATCH /tienda/config (este formulario) y las escrituras de empaques/sucursales/
  // transportadoras son exclusivas de ADMIN — un COLABORADOR/BODEGA solo puede ver los valores
  // actuales (corrección de auditoría, 2026-09-01: antes se dejaban intentar y el backend ya
  // las rechazaba con 403, pero el panel no lo explicaba).
  const isAdmin = authService.getUser()?.rol === 'admin'

  const [envioModo, setEnvioModo] = useState('contra_entrega')
  const [enviaAmbiente, setEnviaAmbiente] = useState('sandbox')
  const [envioGratisActivo, setEnvioGratisActivo] = useState(false)
  const [envioGratisDesde, setEnvioGratisDesde] = useState('')
  const [envioCosto, setEnvioCosto] = useState('')
  const [dominioStaff, setDominioStaff] = useState('')
  const [emailNotificacionPedidos, setEmailNotificacionPedidos] = useState('')
  const [envioConfigLoaded, setEnvioConfigLoaded] = useState(false)
  // El mínimo para envío gratis aplica en "costo fijo" y en "contra entrega" (ahí, al alcanzarlo,
  // la tienda asume el envío). En "envío real" lo decide la cotización, no este monto.
  const envioGratisEditable = envioModo === 'fijo' || envioModo === 'contra_entrega'

  useEffect(() => {
    tiendaConfigService.get()
      .then((cfg) => {
        setEnvioModo(['fijo', 'envia'].includes(cfg?.envio_modo) ? cfg.envio_modo : 'contra_entrega')
        setEnviaAmbiente(cfg?.envia_ambiente === 'produccion' ? 'produccion' : 'sandbox')
        setEnvioGratisActivo(Boolean(cfg?.envio_gratis_activo))
        setEnvioGratisDesde(cfg?.envio_gratis_desde != null ? String(cfg.envio_gratis_desde) : '')
        setEnvioCosto(cfg?.envio_costo != null ? String(cfg.envio_costo) : '')
        setDominioStaff(cfg?.dominio_staff ?? '')
        setEmailNotificacionPedidos(cfg?.email_notificacion_pedidos ?? '')
        setEnvioConfigLoaded(true)
      })
      .catch(() => {})
  }, [])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const isDark = theme === 'dark'

  const toggleTheme = () => {
    setTheme(saveTheme(isDark ? 'light' : 'dark'))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isAdmin) return
    setError('')
    setSaving(true)
    try {
      await tiendaConfigService.update({
        envioModo,
        envioGratisActivo,
        envioGratisDesde: Number(envioGratisDesde) || 0,
        envioCosto: Number(envioCosto) || 0,
        dominioStaff,
        emailNotificacionPedidos,
        enviaAmbiente,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message || 'No se pudo guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <form onSubmit={handleSave} className="space-y-5">
        {/* Apariencia */}
        <div className="section-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {isDark ? <Moon size={16} className="text-gray-500" /> : <Sun size={16} className="text-gray-500" />}
              <div>
                <h2 className="text-sm font-bold text-black">Apariencia</h2>
                <p className="text-xs text-gray-400 mt-0.5">Activa o desactiva el modo oscuro del panel admin.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className={`relative h-7 w-14 transition-colors flex-shrink-0 ${isDark ? 'bg-admin-accent' : 'bg-gray-200'}`}
              aria-pressed={isDark}
              aria-label="Cambiar modo oscuro"
            >
              <span className={`absolute top-1 h-5 w-5 bg-white shadow-sm transition-transform ${isDark ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Info de la tienda */}
        <div className="section-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Store size={16} className="text-gray-500" />
            <h2 className="text-sm font-bold text-black">Información de la tienda</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre de la tienda" value={form.nombre} onChange={set('nombre')} />
            <Input label="NIT / RUT" value={form.nit} onChange={set('nit')} />
          </div>
          <div className="pt-2 border-t border-gray-100">
            <Input
              label="Dominio para colaboradores"
              value={dominioStaff}
              onChange={(e) => setDominioStaff(e.target.value)}
              placeholder="tuempresa.com"
            />
            <p className="text-xs text-gray-400 mt-1">
              Los colaboradores que crees en "Colaboradores" recibirán un usuario con este dominio (ej. juan.perez@{dominioStaff || 'tuempresa.com'}).
            </p>
          </div>
        </div>

        {/* Contacto */}
        <div className="section-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Phone size={16} className="text-gray-500" />
            <h2 className="text-sm font-bold text-black">Contacto</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email de ventas" type="email" value={form.email} onChange={set('email')} />
            <Input label="Teléfono" value={form.telefono} onChange={set('telefono')} />
            <Input label="WhatsApp (solo números)" value={form.whatsapp} onChange={set('whatsapp')} />
            <Input label="Sitio web" value={form.sitioWeb} onChange={set('sitioWeb')} />
          </div>
        </div>

        {/* Ubicación */}
        <div className="section-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <MapPin size={16} className="text-gray-500" />
            <h2 className="text-sm font-bold text-black">Ubicación</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Ciudad" value={form.ciudad} onChange={set('ciudad')} />
            <Input label="Dirección" value={form.direccion} onChange={set('direccion')} />
          </div>
        </div>

        <DireccionesDevolucionSection />

        {/* Los empaques se pueden ir creando desde antes de activar el envío real (Envia.com) —
            así, cuando el admin por fin activa 'envia', ya tiene su catálogo de empaques listo en
            vez de tener que crearlos a última hora (ver EmpaqueService.create en el backend: no
            tiene ninguna restricción por envio_modo, siempre fue seguro crearlos en cualquier
            momento — lo único que hacía falta era dejar de esconder esta sección). */}
        <EmpaquesSection isAdmin={isAdmin} />

        <WompiSection isAdmin={isAdmin} />

        {/* Sucursales/transportadoras sí son específicas de envío real: piden datos (ej.
            dirección de origen) que no aplican con 'contra_entrega'/'fijo'. */}
        {envioModo === 'envia' && (
          <>
            <SucursalesSection isAdmin={isAdmin} />

            <TransportadorasSection isAdmin={isAdmin} />
          </>
        )}

        {/* Envíos y pagos */}
        <div className="section-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <CreditCard size={16} className="text-gray-500" />
            <h2 className="text-sm font-bold text-black">Envíos y pagos</h2>
          </div>
          <div>
            <label className="label-field">Moneda</label>
            <select value={form.moneda} onChange={set('moneda')} className="input-field bg-white sm:max-w-[50%]">
              <option value="COP">COP - Peso Colombiano</option>
              <option value="USD">USD - Dólar</option>
            </select>
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-3">
            <div>
              <p className="text-xs font-bold text-black">¿Cómo se cobra el envío?</p>
              <p className="text-xs text-gray-400 mt-0.5">
                El costo real de envío puede variar bastante y no hay nada que lo calcule automático —
                por eso, por defecto, es el cliente quien le paga al transportador al recibir (contra
                entrega) y no se cobra nada de envío en el checkout online. Actívalo aquí si prefieres
                que la tienda sí cobre un costo fijo.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEnvioModo('contra_entrega')}
                disabled={!envioConfigLoaded}
                className={`text-left p-3 border text-xs disabled:opacity-50 ${
                  envioModo === 'contra_entrega' ? 'border-admin-accent bg-admin-accent/5' : 'border-gray-200'
                }`}
              >
                <p className="font-bold text-black">Contra entrega (recomendado)</p>
                <p className="text-gray-500 mt-0.5">El cliente paga el envío directo al recibir. No se cobra online.</p>
              </button>
              <button
                type="button"
                onClick={() => setEnvioModo('fijo')}
                disabled={!envioConfigLoaded}
                className={`text-left p-3 border text-xs disabled:opacity-50 ${
                  envioModo === 'fijo' ? 'border-admin-accent bg-admin-accent/5' : 'border-gray-200'
                }`}
              >
                <p className="font-bold text-black">Costo fijo</p>
                <p className="text-gray-500 mt-0.5">La tienda cobra un costo de envío controlado por ti.</p>
              </button>
              <button
                type="button"
                onClick={() => setEnvioModo('envia')}
                disabled={!envioConfigLoaded}
                className={`text-left p-3 border text-xs disabled:opacity-50 ${
                  envioModo === 'envia' ? 'border-admin-accent bg-admin-accent/5' : 'border-gray-200'
                }`}
              >
                <p className="font-bold text-black">Envío real (Envia.com)</p>
                <p className="text-gray-500 mt-0.5">Se cotiza y cobra el costo real de la transportadora en el checkout.</p>
              </button>
            </div>
            {envioModo === 'envia' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">
                  Requiere: todos los productos activos con un empaque asignado, al menos una
                  sucursal con dirección de origen, y las credenciales de Envia.com configuradas
                  (contacta al superadmin). Si algo falta, al guardar verás el error específico.
                </p>
                <div>
                  <label className="label-field">Ambiente de Envia.com</label>
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                      <input type="radio" name="envia_ambiente" value="sandbox"
                        checked={enviaAmbiente === 'sandbox'}
                        onChange={() => setEnviaAmbiente('sandbox')} className="accent-black" />
                      Sandbox (pruebas, no cobra dinero real)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                      <input type="radio" name="envia_ambiente" value="produccion"
                        checked={enviaAmbiente === 'produccion'}
                        onChange={() => setEnviaAmbiente('produccion')} className="accent-black" />
                      Producción (guías reales, cobra dinero real)
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-4">
            <div className={envioModo !== 'fijo' ? 'opacity-50' : ''}>
              <Input
                label="Costo de envío base (COP)"
                type="number"
                value={envioCosto}
                onChange={(e) => setEnvioCosto(e.target.value)}
                disabled={!envioConfigLoaded || envioModo !== 'fijo'}
                placeholder={envioConfigLoaded ? '' : 'Cargando...'}
              />
            </div>
            <div className={`space-y-3 ${envioGratisEditable ? '' : 'opacity-50'}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-black">Envío gratis por monto mínimo</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {envioModo === 'contra_entrega'
                      ? 'Si la compra llega a este monto, la tienda asume el envío y el cliente no paga nada al recibir. Por debajo, paga el envío al transportador. También muestra la barra "te faltan $X para envío gratis".'
                      : 'Muestra la barra de progreso "te faltan $X para envío gratis" en la tienda.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnvioGratisActivo((v) => !v)}
                  disabled={!envioConfigLoaded || !envioGratisEditable}
                  className={`relative h-7 w-14 transition-colors flex-shrink-0 disabled:opacity-50 ${envioGratisActivo ? 'bg-admin-accent' : 'bg-gray-200'}`}
                  aria-pressed={envioGratisActivo}
                  aria-label="Activar envío gratis por monto mínimo"
                >
                  <span className={`absolute top-1 h-5 w-5 bg-white shadow-sm transition-transform ${envioGratisActivo ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
              </div>
              <Input
                label="Compra mín. para envío gratis (COP)"
                type="number"
                value={envioGratisDesde}
                onChange={(e) => setEnvioGratisDesde(e.target.value)}
                placeholder={envioConfigLoaded ? '' : 'Cargando...'}
                disabled={!envioGratisActivo || !envioGratisEditable}
                className={!envioGratisActivo ? 'opacity-50' : ''}
              />
            </div>
          </div>
        </div>

        {/* Notificaciones por correo */}
        <div className="section-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Mail size={16} className="text-gray-500" />
            <h2 className="text-sm font-bold text-black">Notificaciones por correo</h2>
          </div>
          <div>
            <Input
              label="Correo para avisos de nuevos pedidos"
              type="email"
              value={emailNotificacionPedidos}
              onChange={(e) => setEmailNotificacionPedidos(e.target.value)}
              disabled={!envioConfigLoaded}
              placeholder={envioConfigLoaded ? 'ej. ventas@tuempresa.com' : 'Cargando...'}
            />
            <p className="text-xs text-gray-400 mt-1">
              Cada vez que un cliente pague un pedido, llega un correo a esta dirección además de la
              notificación dentro del panel. Déjalo vacío para no recibir correos.
            </p>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center justify-end gap-3">
          {!isAdmin && (
            <p className="text-xs text-gray-400">Solo el administrador puede guardar esta configuración.</p>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={saving || !isAdmin} className={`btn-primary ${saved ? 'bg-admin-accent hover:bg-admin-accent-hover text-admin-accent-contrast' : ''}`}>
            <Save size={15} />
            {saving ? 'Guardando…' : saved ? '¡Guardado!' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
