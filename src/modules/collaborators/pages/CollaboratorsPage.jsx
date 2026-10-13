import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, X, Check, Users, Pencil } from 'lucide-react'
import { collaboratorService } from '../../../services/collaboratorService'
import { tiendaConfigService } from '../../../services/tiendaConfigService'
import { sucursalService } from '../../../services/sucursalService'
import { authService } from '../../../services/authService'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'
import EmptyState from '../../../components/ui/EmptyState'

const ROLES = [
  { value: 'colaborador', label: 'Colaborador' },
  { value: 'bodega', label: 'Bodega' },
]

const ROL_BADGE = { colaborador: 'info', bodega: 'warning', admin: 'dark' }

function emptyForm() {
  return {
    nombre: '', usuario: '', password: '', rol: 'colaborador', sucursalId: '',
    apellido: '', telefono: '', tipoDocumento: 'CC', numeroDocumento: '', fechaNacimiento: '',
  }
}

function formFromItem(item) {
  return {
    nombre: item.nombre ?? '', usuario: '', password: '', rol: item.rol,
    sucursalId: item.sucursal_id ?? '',
    apellido: item.apellido ?? '', telefono: item.telefono ?? '',
    tipoDocumento: item.tipo_documento ?? 'CC', numeroDocumento: item.numero_documento ?? '',
    fechaNacimiento: item.fecha_nacimiento ?? '',
    emailActual: item.email ?? '', // solo para mostrar — el campo "usuario" vacío no lo toca
  }
}

export default function CollaboratorsPage() {
  const rol = authService.getUser()?.rol
  const [items, setItems] = useState([])
  const [dominio, setDominio] = useState(null)
  const [sucursales, setSucursales] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'create' | 'edit'
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([collaboratorService.list(), tiendaConfigService.get(), sucursalService.list()])
      .then(([lista, cfg, sucs]) => {
        setItems(Array.isArray(lista) ? lista : [])
        setDominio(cfg?.dominio_staff ?? null)
        setSucursales(Array.isArray(sucs) ? sucs : [])
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (rol === 'admin' || rol === 'superadmin') load()
    else setLoading(false)
  }, [])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const openCreate = () => { setForm(emptyForm()); setError(''); setModal('create') }
  const openEdit = (item) => { setForm(formFromItem(item)); setEditId(item.id); setError(''); setModal('edit') }
  const closeModal = () => setModal(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (modal === 'create') await collaboratorService.create(form)
      else await collaboratorService.update(editId, form)
      closeModal()
      load()
    } catch (err) {
      setError(err.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const toggleActivo = async (item) => {
    try {
      await collaboratorService.setActivo(item.id, !item.activo)
      load()
    } catch (err) {
      alert(err.message || 'No se pudo actualizar')
    }
  }

  if (rol !== 'admin' && rol !== 'superadmin') {
    return (
      <div className="section-card">
        <EmptyState title="No tienes acceso a esta sección" description="Solo un administrador puede gestionar colaboradores." />
      </div>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Cargando…</div>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Colaboradores</h1>
          <p className="page-subtitle">Usuarios del panel con rol de colaborador o bodega.</p>
        </div>
        {dominio && (
          <button onClick={openCreate} className="btn-primary"><Plus size={15} /> Nuevo colaborador</button>
        )}
      </div>

      {!dominio ? (
        <div className="section-card">
          <EmptyState
            title="Configura primero el dominio de tu tienda"
            description="Antes de crear colaboradores, define el dominio que se usará para sus usuarios (ej. tunombre@tuempresa.com) en Configuración."
            action={<Link to="/configuracion" className="btn-primary">Ir a Configuración</Link>}
          />
        </div>
      ) : (
        <div className="section-card">
          {items.length === 0 ? (
            <EmptyState
              title="Sin colaboradores"
              description="Aún no has creado ningún colaborador o personal de bodega."
              action={<button onClick={openCreate} className="btn-primary">Crear colaborador</button>}
            />
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header px-5 py-3 text-left">Nombre</th>
                  <th className="table-header px-4 py-3 text-left">Usuario</th>
                  <th className="table-header px-4 py-3 text-center">Tienda</th>
                  <th className="table-header px-4 py-3 text-center">Rol</th>
                  <th className="table-header px-4 py-3 text-center">Estado</th>
                  <th className="table-header px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-violet-950 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {c.nombre?.charAt(0) ?? <Users size={14} />}
                        </div>
                        <div>
                          <span className="font-semibold text-black text-sm block">
                            {c.nombre} {c.apellido}
                          </span>
                          {c.telefono && <span className="text-xs text-gray-400">{c.telefono}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell px-4 text-gray-500">{c.email}</td>
                    <td className="table-cell px-4 text-center text-gray-500">{c.sucursal_nombre ?? '—'}</td>
                    <td className="table-cell px-4 text-center">
                      <Badge variant={ROL_BADGE[c.rol] ?? 'default'}>{c.rol}</Badge>
                    </td>
                    <td className="table-cell px-4 text-center">
                      <Badge variant={c.activo ? 'success' : 'danger'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge>
                    </td>
                    <td className="table-cell px-4">
                      <div className="flex items-center justify-center gap-1">
                        {c.rol !== 'admin' && (
                          <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-black transition-colors" title="Editar">
                            <Pencil size={14} />
                          </button>
                        )}
                        {c.rol !== 'admin' && (
                          <button onClick={() => toggleActivo(c)} className="btn-secondary text-xs">
                            {c.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal open={modal !== null} onClose={closeModal} title={modal === 'create' ? 'Nuevo colaborador' : 'Editar colaborador'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre" value={form.nombre} onChange={set('nombre')} required />
            <Input label="Apellido" value={form.apellido} onChange={set('apellido')} />
          </div>

          <div>
            <label className="label-field">Tienda</label>
            <select value={form.sucursalId} onChange={set('sucursalId')} className="input-field bg-white" required>
              <option value="">Selecciona una tienda</option>
              {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">A esta tienda quedarán atribuidas las ventas que gestione.</p>
          </div>

          {modal === 'edit' && (
            <>
              <div>
                <label className="label-field">Usuario (opcional)</label>
                <input
                  className="input-field"
                  value={form.usuario}
                  onChange={set('usuario')}
                  placeholder="Déjalo vacío para no cambiarlo"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Correo actual: <span className="font-semibold text-gray-600">{form.emailActual}</span>
                  {form.usuario && (
                    <> — nuevo: <span className="font-semibold text-gray-600">{form.usuario}@{dominio}</span></>
                  )}
                </p>
              </div>
              <Input label="Nueva contraseña (opcional)" type="password" value={form.password} onChange={set('password')}
                minLength={8} placeholder="Déjalo vacío para no cambiarla" />
            </>
          )}

          {modal === 'create' && (
            <>
              <div>
                <label className="label-field">Usuario</label>
                <input
                  className="input-field"
                  value={form.usuario}
                  onChange={set('usuario')}
                  placeholder="ej: juan.perez"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Su usuario de acceso será: <span className="font-semibold text-gray-600">{form.usuario || '...'}@{dominio}</span>
                </p>
              </div>

              <Input label="Contraseña" type="password" value={form.password} onChange={set('password')}
                minLength={8} required placeholder="Mínimo 8 caracteres" />

              <div>
                <label className="label-field">Rol</label>
                <select value={form.rol} onChange={set('rol')} className="input-field bg-white">
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </>
          )}

          <Input label="Teléfono" value={form.telefono} onChange={set('telefono')} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Tipo de documento</label>
              <select value={form.tipoDocumento} onChange={set('tipoDocumento')} className="input-field bg-white">
                <option value="CC">Cédula de ciudadanía</option>
                <option value="CE">Cédula de extranjería</option>
                <option value="TI">Tarjeta de identidad</option>
                <option value="PP">Pasaporte</option>
                <option value="NIT">NIT</option>
              </select>
            </div>
            <Input label="Número de documento" value={form.numeroDocumento} onChange={set('numeroDocumento')} />
          </div>

          <Input label="Fecha de nacimiento" type="date" value={form.fechaNacimiento} onChange={set('fechaNacimiento')} />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary"><X size={14} /> Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">
              <Check size={14} /> {saving ? 'Guardando…' : modal === 'create' ? 'Crear colaborador' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
