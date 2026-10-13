import { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, Trash2, X, Check, Package, Upload, ChevronUp, ChevronDown } from 'lucide-react'
import { coleccionService } from '../../../services/coleccionService'
import { productService } from '../../../services/productService'
import { api } from '../../../services/api'
import { slugify } from '../../../utils/format'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'
import EmptyState from '../../../components/ui/EmptyState'

function emptyForm() {
  return { nombre: '', slug: '', descripcion: '', activo: true, productoIds: [], imagen_url: '', _pendingFile: null }
}

export default function ColeccionesPage() {
  const [colecciones, setColecciones] = useState([])
  const [productos,   setProductos]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modal,       setModal]       = useState(null)   // null | 'create' | 'edit'
  const [form,        setForm]        = useState(emptyForm())
  const [editId,      setEditId]      = useState(null)
  const [saving,      setSaving]      = useState(false)
  const [search,      setSearch]      = useState('')
  const imgInputRef = useRef(null)

  useEffect(() => {
    Promise.all([coleccionService.getAll(), productService.getAll({ size: 500 })])
      .then(([cols, prods]) => {
        setColecciones(Array.isArray(cols) ? cols : [])
        setProductos(Array.isArray(prods?.content) ? prods.content : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const reload = () => coleccionService.getAll().then((d) => setColecciones(Array.isArray(d) ? d : []))

  const openCreate = () => { setForm(emptyForm()); setEditId(null); setSearch(''); setModal('create') }
  const openEdit   = (c) => {
    setForm({
      nombre: c.nombre, slug: c.slug, descripcion: c.descripcion ?? '',
      activo: c.activo, productoIds: c.producto_ids ?? [],
      imagen_url: c.imagen_url ?? '', _pendingFile: null,
    })
    setEditId(c.id)
    setSearch('')
    setModal('edit')
  }
  const closeModal = () => {
    if (form._pendingFile) URL.revokeObjectURL(form.imagen_url)
    setModal(null)
    setSearch('')
  }

  const handleImgFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (form._pendingFile) URL.revokeObjectURL(form.imagen_url)
    setForm((f) => ({ ...f, imagen_url: URL.createObjectURL(file), _pendingFile: file }))
    if (imgInputRef.current) imgInputRef.current.value = ''
  }

  const set = (field) => (e) => setForm((f) => {
    const val = e.target.value
    const updated = { ...f, [field]: val }
    if (field === 'nombre') updated.slug = slugify(val)
    return updated
  })

  const toggleProducto = (prdId) => {
    setForm((f) => ({
      ...f,
      productoIds: f.productoIds.includes(prdId)
        ? f.productoIds.filter((id) => id !== prdId)
        : [...f.productoIds, prdId],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) { alert('El nombre es obligatorio'); return }
    setSaving(true)
    try {
      let imagenUrl = form.imagen_url || null
      if (form._pendingFile) {
        const fd = new FormData()
        fd.append('file', form._pendingFile)
        const { url } = await api.upload('/upload/coleccion', fd)
        URL.revokeObjectURL(form.imagen_url)
        imagenUrl = url
      }
      const data = {
        nombre:      form.nombre.trim(),
        slug:        form.slug.trim(),
        descripcion: form.descripcion.trim() || null,
        activo:      form.activo,
        producto_ids: form.productoIds,
        imagen_url:  imagenUrl,
      }
      if (modal === 'create') await coleccionService.create(data)
      else await coleccionService.update(editId, data)
      await reload()
      closeModal()
    } catch (err) {
      alert('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c) => {
    if (!confirm(`¿Eliminar la colección "${c.nombre}"? Se quitarán los productos asignados.`)) return
    try {
      await coleccionService.remove(c.id)
      await reload()
    } catch (err) {
      alert('Error al eliminar: ' + err.message)
    }
  }

  const moveColeccion = async (index, dir) => {
    const next = [...colecciones]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    try {
      await coleccionService.reordenar(next.map((c) => c.id))
      await reload()
    } catch {
      // la lista sigue viniendo de reload(), sin estado local que revertir
    }
  }

  const filteredProductos = productos.filter((p) =>
    !search || p.nombre.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Cargando colecciones…</div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Colecciones</h1>
          <p className="page-subtitle">Agrupa productos en colecciones visibles en la tienda</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={15} /> Nueva colección</button>
      </div>

      {/* Lista */}
      {colecciones.length === 0 ? (
        <EmptyState
          title="Sin colecciones"
          description="Crea tu primera colección para destacar grupos de productos en la tienda."
          action={<button onClick={openCreate} className="btn-primary">Crear colección</button>}
        />
      ) : (
        <div className="section-card divide-y divide-gray-50">
          {colecciones.map((c, index) => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
              {/* Reordenar */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button onClick={() => moveColeccion(index, -1)} disabled={index === 0}
                  className="p-0.5 text-gray-300 hover:text-black disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                  <ChevronUp size={14} />
                </button>
                <button onClick={() => moveColeccion(index, 1)} disabled={index === colecciones.length - 1}
                  className="p-0.5 text-gray-300 hover:text-black disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                  <ChevronDown size={14} />
                </button>
              </div>
              {/* Imagen */}
              <div className="w-16 h-12 overflow-hidden bg-gray-100 flex-shrink-0">
                {c.imagen_url ? (
                  <img src={c.imagen_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={16} className="text-gray-300" />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-black truncate">{c.nombre}</p>
                <p className="text-xs text-gray-400">{(c.producto_ids ?? []).length} producto(s)</p>
              </div>
              <Badge variant={c.activo ? 'success' : 'danger'}>{c.activo ? 'Activa' : 'Inactiva'}</Badge>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)}
                  className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-black transition-colors">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(c)}
                  className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      <Modal open={modal !== null} onClose={closeModal}
        title={modal === 'create' ? 'Nueva colección' : 'Editar colección'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre" value={form.nombre} onChange={set('nombre')} placeholder="Ej: Verano 2026" />
            <Input label="Slug (URL)" value={form.slug} onChange={set('slug')} placeholder="verano-2026" />
          </div>

          <div>
            <label className="label-field">Descripción (opcional)</label>
            <textarea value={form.descripcion} onChange={set('descripcion')} rows={2}
              placeholder="Descripción breve de la colección…" className="input-field resize-none" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Activa</span>
            <button type="button" onClick={() => setForm((f) => ({ ...f, activo: !f.activo }))}
              className={`relative inline-flex h-6 w-11 items-center transition-colors ${form.activo ? 'bg-black' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform bg-white transition-transform ${form.activo ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Imagen de portada/banner */}
          <div>
            <label className="label-field">Imagen de portada / banner (opcional)</label>
            <div className="flex items-center gap-3">
              <div className="w-24 h-14 overflow-hidden bg-black flex-shrink-0 flex items-center justify-center">
                {form.imagen_url ? (
                  <img src={form.imagen_url} alt="" className="w-full h-full object-cover opacity-70" />
                ) : (
                  <Package size={16} className="text-white/40" />
                )}
              </div>
              <div className="flex-1">
                <button type="button" onClick={() => imgInputRef.current?.click()} className="btn-secondary text-xs">
                  <Upload size={13} /> {form.imagen_url ? 'Cambiar imagen' : 'Subir imagen'}
                </button>
                {form._pendingFile && (
                  <p className="text-[10px] text-yellow-600 font-semibold mt-1">Pendiente — se sube al guardar</p>
                )}
                {form.imagen_url && !form._pendingFile && (
                  <button type="button" onClick={() => setForm((f) => ({ ...f, imagen_url: '', _pendingFile: null }))}
                    className="block text-[10px] text-red-500 hover:text-red-700 mt-1">
                    Quitar imagen
                  </button>
                )}
              </div>
            </div>
            <input ref={imgInputRef} type="file" accept="image/*" hidden onChange={handleImgFile} />
          </div>

          {/* Selector de productos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label-field mb-0">
                Productos <span className="text-gray-400 font-normal">({form.productoIds.length} seleccionados)</span>
              </label>
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto…" className="text-xs input-field w-44 py-1.5"
              />
            </div>
            <div className="border border-gray-200 overflow-hidden max-h-56 overflow-y-auto">
              {filteredProductos.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">Sin resultados</p>
              ) : (
                filteredProductos.map((p) => {
                  const selected = form.productoIds.includes(p.id)
                  return (
                    <button key={p.id} type="button" onClick={() => toggleProducto(p.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-gray-50 last:border-0
                        ${selected ? 'bg-admin-accent-subtle' : 'hover:bg-gray-50'}`}>
                      <div className={`w-4 h-4 flex items-center justify-center flex-shrink-0 border transition-colors
                        ${selected ? 'bg-black border-black' : 'border-gray-300'}`}>
                        {selected && <Check size={10} className="text-white" />}
                      </div>
                      <span className="text-xs font-medium truncate">{p.nombre}</span>
                      {!p.activo && <span className="text-[10px] text-gray-400 ml-auto">inactivo</span>}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={closeModal} className="btn-secondary"><X size={14} /> Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">
              <Check size={14} /> {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
