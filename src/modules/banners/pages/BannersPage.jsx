import { useRef, useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Check, Image as ImageIcon, Video, Upload, ChevronUp, ChevronDown } from 'lucide-react'
import { useBanners } from '../hooks/useBanners'
import { api } from '../../../services/api'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'
import EmptyState from '../../../components/ui/EmptyState'

const MAX_VIDEO_MB = 25
// El hero de la tienda ocupa el ancho completo (tope 1920px) con un alto fijo de 540px en
// pantallas anchas (ver HERO_H en HomePage.jsx de tienda-jeyavila) — 1920×540 = 32:9,
// no 16:9. Con menos ancho de pantalla se ve más "cuadrado" porque el alto no crece más allá de
// esos 540px, pero como la imagen se recorta con object-cover, subir a esta proporción es lo
// que menos recorte de sobra deja en el caso más ancho (el que más se nota).
const HERO_DIM    = '1920 × 540 px'
const HERO_RATIO  = 'aspect-[32/9]'

function emptyForm() {
  return {
    posicion: 'hero', tipo: 'imagen', url: '',
    titulo: '', cta_link: '',
    activo: true, _pendingFile: null,
  }
}

function BannerPreview({ tipo, url, isPending }) {
  if (!url) {
    return (
      <div className={`${HERO_RATIO} w-full border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center`}>
        <p className="text-xs text-gray-400">Sin archivo</p>
      </div>
    )
  }
  return (
    <div className={`${HERO_RATIO} w-full overflow-hidden bg-black relative ${isPending ? 'ring-2 ring-offset-1 ring-yellow-400' : ''}`}>
      {tipo === 'video'
        ? <video src={url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
        : <img src={url} alt="" className="w-full h-full object-cover" />}
    </div>
  )
}

export default function BannersPage() {
  const { banners, loading, create, update, remove, reload } = useBanners()
  const [ordered, setOrdered] = useState([])
  const [modal, setModal]     = useState(null)
  const [form, setForm]       = useState(emptyForm())
  const [saving, setSaving]   = useState(false)
  const fileInputRef          = useRef(null)

  // Sincroniza la lista local cuando cambian los banners del servidor
  useEffect(() => {
    const hero = [...banners.filter((b) => b.posicion === 'hero')]
      .sort((a, b) => a.orden - b.orden)
    setOrdered(hero)
  }, [banners])

  const openCreate = () => { setForm(emptyForm()); setModal('create') }
  const openEdit   = (b) => {
    setForm({
      posicion: 'hero', tipo: b.tipo, url: b.url,
      titulo: b.titulo ?? '', cta_link: b.cta_link ?? '',
      activo: b.activo, id: b.id, _pendingFile: null,
    })
    setModal('edit')
  }
  const closeModal = () => setModal(null)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const esVideo = file.type.startsWith('video/')
    if (esVideo && file.size > MAX_VIDEO_MB * 1024 * 1024) {
      alert(`El video no puede superar ${MAX_VIDEO_MB} MB.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    if (form._pendingFile) URL.revokeObjectURL(form.url)
    setForm((f) => ({ ...f, tipo: esVideo ? 'video' : 'imagen', url: URL.createObjectURL(file), _pendingFile: file }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.url) { alert('Sube un archivo antes de guardar.'); return }
    // Bloquear protocolos peligrosos en el enlace
    if (form.cta_link) {
      const lower = form.cta_link.trim().toLowerCase()
      if (/^(javascript|data|vbscript):/.test(lower)) {
        alert('El enlace contiene un protocolo no permitido.')
        return
      }
    }
    setSaving(true)
    try {
      let finalUrl = form.url
      if (form._pendingFile) {
        const fd = new FormData()
        fd.append('file', form._pendingFile)
        fd.append('esVideo', form.tipo === 'video' ? 'true' : 'false')
        const { url } = await api.upload('/upload/banner', fd)
        URL.revokeObjectURL(form.url)
        finalUrl = url
      }
      const data = {
        posicion: 'hero', tipo: form.tipo, url: finalUrl,
        titulo: form.titulo || null, cta_link: form.cta_link || null,
        activo: form.activo,
      }
      if (modal === 'create') await create(data)
      else await update(form.id, data)
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (b) => {
    if (!confirm(`¿Eliminar el banner "${b.titulo || 'sin título'}"?`)) return
    await remove(b.id)
  }

  // Mueve un banner en la lista local y persiste el nuevo orden en el backend
  const move = async (index, dir) => {
    const next = [...ordered]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setOrdered(next)
    try {
      await api.patch('/banners/reordenar', next.map((b) => b.id))
      reload()
    } catch {
      // Revertir si falla
      setOrdered(ordered)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Cargando banners…</div>
  )

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Banners</h1>
          <p className="page-subtitle">Imágenes o videos en la parte superior de la tienda. Recomendado: {HERO_DIM}.</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={15} /> Nuevo banner</button>
      </div>

      {/* Lista */}
      <div className="section-card">
        {ordered.length === 0 ? (
          <EmptyState title="Sin banners"
            description="Agrega la primera imagen o video para la parte superior de la tienda."
            action={<button onClick={openCreate} className="btn-primary">Crear banner</button>} />
        ) : (
          <div className="divide-y divide-gray-50">
            {ordered.map((b, i) => (
              <BannerRow key={b.id} b={b}
                onEdit={() => openEdit(b)}
                onDelete={() => handleDelete(b)}
                onMoveUp={i > 0 ? () => move(i, -1) : null}
                onMoveDown={i < ordered.length - 1 ? () => move(i, 1) : null}
              />
            ))}
          </div>
        )}
        {ordered.length > 1 && (
          <p className="text-[10px] text-gray-400 text-center py-2">
            Usa las flechas para cambiar el orden de aparición en la tienda
          </p>
        )}
      </div>

      {/* Modal */}
      <Modal open={modal !== null} onClose={closeModal}
        title={modal === 'create' ? 'Nuevo banner' : 'Editar banner'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="label-field">Imagen o video ({HERO_DIM} recomendado)</label>
            <BannerPreview tipo={form.tipo} url={form.url} isPending={!!form._pendingFile} />
            <div className="flex items-center gap-2 mt-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary text-xs">
                <Upload size={13} /> {form.url ? 'Reemplazar' : 'Subir archivo'}
              </button>
              {form._pendingFile && (
                <span className="text-[10px] text-yellow-600 font-semibold">Pendiente — se sube al guardar</span>
              )}
            </div>
            <input ref={fileInputRef} type="file" hidden
              accept="image/*,video/mp4,video/webm" onChange={handleFile} />
          </div>

          <Input label="Título (opcional)" value={form.titulo} onChange={set('titulo')} placeholder="Ej: Tu estilo, tu identidad" />
          <Input label="Enlace al hacer clic (opcional)" value={form.cta_link} onChange={set('cta_link')}
            placeholder="https://wa.me/57... · https://youtube.com/... · /catalogo" />

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-600">Banner activo</span>
            <button type="button" onClick={() => setForm((f) => ({ ...f, activo: !f.activo }))}
              className={`relative inline-flex h-6 w-11 items-center transition-colors ${form.activo ? 'bg-black' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform bg-white transition-transform ${form.activo ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex justify-end gap-3">
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

function BannerRow({ b, onEdit, onDelete, onMoveUp, onMoveDown }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">

      {/* Controles de orden */}
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <button onClick={onMoveUp} disabled={!onMoveUp}
          className="p-0.5 text-gray-300 hover:text-black disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
          <ChevronUp size={14} />
        </button>
        <button onClick={onMoveDown} disabled={!onMoveDown}
          className="p-0.5 text-gray-300 hover:text-black disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Miniatura */}
      <div className="w-20 h-12 overflow-hidden bg-black flex-shrink-0">
        {b.tipo === 'video'
          ? <video src={b.url} className="w-full h-full object-cover" muted />
          : <img src={b.url} alt="" className="w-full h-full object-cover" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-black truncate">{b.titulo || '(sin título)'}</p>
        {b.cta_link && <p className="text-xs text-gray-400 truncate">{b.cta_link}</p>}
      </div>

      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
        {b.tipo === 'video' ? <Video size={12} /> : <ImageIcon size={12} />} {b.tipo}
      </span>

      <Badge variant={b.activo ? 'success' : 'danger'}>{b.activo ? 'Activo' : 'Inactivo'}</Badge>

      <div className="flex gap-1">
        <button onClick={onEdit}
          className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-black transition-colors">
          <Edit2 size={14} />
        </button>
        <button onClick={onDelete}
          className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
