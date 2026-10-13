import { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, Trash2, X, Check, ChevronDown, ChevronRight, ChevronUp, Upload } from 'lucide-react'
import { useCategories } from '../hooks/useCategories'
import { categoryService } from '../../../services/categoryService'
import { subcategoryService } from '../../../services/subcategoryService'
import { api } from '../../../services/api'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'
import EmptyState from '../../../components/ui/EmptyState'

function emptycat() {
  return { nombre: '', slug: '', imagen_url: '', orden: 0, activo: true, _pendingFile: null }
}

function emptysub(catId) {
  return { cat_id: catId, nombre: '', slug: '', orden: 0, activo: true }
}

function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

export default function CategoriesPage() {
  const { categories, loading, error, reload, create, update, remove } = useCategories()
  const [modal, setModal]       = useState(null)
  const [form, setForm]         = useState(emptycat())
  const [expanded, setExpanded] = useState({})
  const [subcats, setSubcats]   = useState({})
  const [subModal, setSubModal] = useState(null)
  const [subForm, setSubForm]   = useState({})
  const [saving, setSaving]     = useState(false)
  const imgInputRef             = useRef(null)

  // Carga subcategorías cuando cambia la lista de categorías
  useEffect(() => {
    if (categories.length === 0) return
    let cancelled = false
    Promise.all(
      categories.map(c =>
        subcategoryService.getByCat(c.id).then(subs => [c.id, Array.isArray(subs) ? subs : []])
      )
    ).then(entries => {
      if (!cancelled) setSubcats(Object.fromEntries(entries))
    }).catch(() => {})
    return () => { cancelled = true }
  }, [categories])

  const openCreate = () => { setForm(emptycat()); setModal('create') }
  const openEdit   = (cat) => {
    setForm({ ...cat, imagen_url: cat.imagen_url ?? '', _pendingFile: null })
    setModal('edit')
  }
  const closeModal = () => {
    if (form._pendingFile) URL.revokeObjectURL(form.imagen_url)
    setModal(null)
  }

  const handleImgFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (form._pendingFile) URL.revokeObjectURL(form.imagen_url)
    setForm((f) => ({ ...f, imagen_url: URL.createObjectURL(file), _pendingFile: file }))
    if (imgInputRef.current) imgInputRef.current.value = ''
  }

  const set = (field) => (e) => setForm((f) => {
    const updated = { ...f, [field]: e.target.value }
    if (field === 'nombre') updated.slug = slugify(e.target.value)
    return updated
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      let imagenUrl = form.imagen_url || null
      if (form._pendingFile) {
        const fd = new FormData()
        fd.append('file', form._pendingFile)
        const { url } = await api.upload('/upload/categoria', fd)
        URL.revokeObjectURL(form.imagen_url)
        imagenUrl = url
      }
      const data = { ...form, imagen_url: imagenUrl, _pendingFile: undefined }
      if (modal === 'create') await create(data)
      else await update(form.id, data)
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cat) => {
    if (!confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return
    await remove(cat.id)
  }

  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  /* subcategorías */
  const openSubCreate = (catId) => { setSubForm(emptysub(catId)); setSubModal('create') }
  const openSubEdit   = (sub)   => { setSubForm({ ...sub }); setSubModal('edit') }
  const closeSubModal = () => setSubModal(null)

  const setSub = (field) => (e) => setSubForm((f) => {
    const updated = { ...f, [field]: e.target.value }
    if (field === 'nombre') updated.slug = slugify(e.target.value)
    return updated
  })

  const reloadSubcats = async (catId) => {
    const subs = await subcategoryService.getByCat(catId)
    setSubcats(prev => ({ ...prev, [catId]: Array.isArray(subs) ? subs : [] }))
  }

  const handleSubSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        cat_id:  subForm.cat_id,
        nombre:  subForm.nombre,
        slug:    subForm.slug,
        orden:   Number(subForm.orden ?? 0),
        activo:  subForm.activo,
      }
      if (subModal === 'create') await subcategoryService.create(payload)
      else await subcategoryService.update(subForm.id, payload)
      await reloadSubcats(subForm.cat_id)
      closeSubModal()
    } finally {
      setSaving(false)
    }
  }

  const handleSubDelete = async (sub) => {
    if (!confirm(`¿Eliminar subcategoría "${sub.nombre}"?`)) return
    await subcategoryService.remove(sub.id)
    await reloadSubcats(sub.cat_id)
  }

  const moveCategory = async (index, dir) => {
    const next = [...categories]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    try {
      await categoryService.reordenar(next.map((c) => c.id))
      reload()
    } catch {
      // sin cambio local que revertir — la lista sigue viniendo de useCategories()
    }
  }

  const moveSubcategory = async (catId, index, dir) => {
    const list = subcats[catId] ?? []
    const next = [...list]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setSubcats((prev) => ({ ...prev, [catId]: next }))
    try {
      await subcategoryService.reordenar(next.map((s) => s.id))
    } catch {
      await reloadSubcats(catId)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Cargando categorías…</div>
  )

  if (error) return (
    <div className="section-card p-6 text-red-600 text-sm">Error: {error}</div>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className="btn-primary"><Plus size={15} /> Nueva categoría</button>
      </div>

      {categories.length === 0 ? (
        <div className="section-card">
          <EmptyState title="Sin categorías" description="Crea tu primera categoría."
            action={<button onClick={openCreate} className="btn-primary">Crear categoría</button>} />
        </div>
      ) : (
        <div className="section-card divide-y divide-gray-50">
          {categories.map((cat, catIndex) => {
            const subs   = subcats[cat.id] ?? []
            const isOpen = !!expanded[cat.id]
            return (
              <div key={cat.id}>
                {/* Fila categoría */}
                <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button onClick={() => moveCategory(catIndex, -1)} disabled={catIndex === 0}
                      className="p-0.5 text-gray-300 hover:text-black disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                      <ChevronUp size={14} />
                    </button>
                    <button onClick={() => moveCategory(catIndex, 1)} disabled={catIndex === categories.length - 1}
                      className="p-0.5 text-gray-300 hover:text-black disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <button onClick={() => toggleExpand(cat.id)} className="p-1 text-gray-400 hover:text-black transition-colors">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {cat.imagen_url ? (
                    <img src={cat.imagen_url} alt={cat.nombre} className="w-10 h-10 object-cover bg-gray-100 flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 bg-black flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {cat.nombre.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black">{cat.nombre}</p>
                    <p className="text-xs text-gray-400 font-mono">{cat.slug}</p>
                  </div>
                  <span className="text-xs text-gray-500">{subs.length} subcats</span>
                  <Badge variant={cat.activo ? 'success' : 'danger'}>{cat.activo ? 'Activa' : 'Inactiva'}</Badge>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(cat)} className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-black transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(cat)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* Subcategorías */}
                {isOpen && (
                  <div className="bg-gray-50/60 border-t border-gray-100">
                    {subs.map((sub, subIndex) => (
                      <div key={sub.id} className="flex items-center gap-4 pl-14 pr-5 py-2.5 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col gap-0.5 flex-shrink-0">
                          <button onClick={() => moveSubcategory(cat.id, subIndex, -1)} disabled={subIndex === 0}
                            className="p-0.5 text-gray-300 hover:text-black disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                            <ChevronUp size={12} />
                          </button>
                          <button onClick={() => moveSubcategory(cat.id, subIndex, 1)} disabled={subIndex === subs.length - 1}
                            className="p-0.5 text-gray-300 hover:text-black disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                            <ChevronDown size={12} />
                          </button>
                        </div>
                        <div className="w-1.5 h-1.5 bg-gray-300 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-black">{sub.nombre}</p>
                          <p className="text-xs text-gray-400 font-mono">{sub.slug}</p>
                        </div>
                        <Badge variant={sub.activo ? 'success' : 'danger'} className="text-xs">{sub.activo ? 'Activa' : 'Inactiva'}</Badge>
                        <div className="flex gap-1">
                          <button onClick={() => openSubEdit(sub)} className="p-1 hover:bg-gray-100 text-gray-400 hover:text-black transition-colors"><Edit2 size={12} /></button>
                          <button onClick={() => handleSubDelete(sub)} className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    ))}
                    <div className="pl-14 pr-5 py-2">
                      <button onClick={() => openSubCreate(cat.id)} className="text-xs text-gray-400 hover:text-black flex items-center gap-1 transition-colors">
                        <Plus size={12} /> Añadir subcategoría
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal categoría */}
      <Modal open={modal !== null} onClose={closeModal} title={modal === 'create' ? 'Nueva Categoría' : 'Editar Categoría'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={form.nombre} onChange={set('nombre')} placeholder="Ej: Hombre" required />
          <Input label="Slug (URL)" value={form.slug} onChange={set('slug')} placeholder="hombre" required />
          {/* Imagen de categoría — solo al editar: recién creada la categoría aún no tiene
              id real, así que la imagen se agrega después desde "Editar". */}
          {modal === 'edit' && (
            <div>
              <label className="label-field">Imagen (opcional)</label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 overflow-hidden bg-black flex-shrink-0 flex items-center justify-center">
                  {form.imagen_url ? (
                    <img src={form.imagen_url} alt="" className="w-full h-full object-cover opacity-70" />
                  ) : (
                    <span className="text-white text-xs font-bold">{form.nombre?.charAt(0) || '?'}</span>
                  )}
                </div>
                <div className="flex-1">
                  <button type="button" onClick={() => imgInputRef.current?.click()}
                    className="btn-secondary text-xs">
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
                  <p className="text-[10px] text-gray-400 mt-1">
                    Si no hay imagen se usará la del primer producto de esta categoría.
                  </p>
                </div>
              </div>
              <input ref={imgInputRef} type="file" accept="image/*" hidden onChange={handleImgFile} />
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-600">Categoría activa</span>
            <button type="button" onClick={() => setForm((f) => ({ ...f, activo: !f.activo }))}
              className={`relative inline-flex h-6 w-11 items-center transition-colors ${form.activo ? 'bg-black' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform bg-white transition-transform ${form.activo ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="btn-secondary"><X size={14} /> Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary"><Check size={14} /> {saving ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal subcategoría */}
      <Modal open={subModal !== null} onClose={closeSubModal} title={subModal === 'create' ? 'Nueva Subcategoría' : 'Editar Subcategoría'} size="sm">
        <form onSubmit={handleSubSubmit} className="space-y-4">
          <Input label="Nombre" value={subForm.nombre ?? ''} onChange={setSub('nombre')} placeholder="Ej: Tenis" required />
          <Input label="Slug" value={subForm.slug ?? ''} onChange={setSub('slug')} placeholder="tenis" required />
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-600">Subcategoría activa</span>
            <button type="button" onClick={() => setSubForm((f) => ({ ...f, activo: !f.activo }))}
              className={`relative inline-flex h-6 w-11 items-center transition-colors ${subForm.activo ? 'bg-black' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform bg-white transition-transform ${subForm.activo ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={closeSubModal} className="btn-secondary"><X size={14} /> Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary"><Check size={14} /> {saving ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
