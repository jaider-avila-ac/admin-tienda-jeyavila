import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2, Upload, Video, X } from 'lucide-react'
import { productService } from '../../../services/productService'
import { categoryService } from '../../../services/categoryService'
import { subcategoryService } from '../../../services/subcategoryService'
import { empaqueService } from '../../../services/empaqueService'
import { tiendaConfigService } from '../../../services/tiendaConfigService'
import { api } from '../../../services/api'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import { slugify } from '../../../utils/format'

const MAX_VIDEO_MB = 50

/* ── Catálogo de campos extra por tipo de artículo ─────── */
const TIPOS_ARTICULO = [
  { value: 'ropa_superior', label: 'Ropa superior (camisas, blusas, sweaters…)' },
  { value: 'ropa_inferior', label: 'Ropa inferior (jeans, pantalones, faldas…)' },
  { value: 'vestido',       label: 'Vestido / Enterizo / Jumpsuit' },
  { value: 'accesorio',     label: 'Accesorio (bolsos, cinturones, gorras…)' },
  { value: 'calzado',       label: 'Calzado' },
]

const CAMPOS_EXTRAS = {
  calzado: [
    { key: 'tipo_calzado', label: 'Tipo',           tipo: 'select', opciones: ['Tenis','Botines','Tacones','Sandalias','Mocasines','Botas','Baletas','Zapatillas','Plataformas'] },
    { key: 'altura_tacon', label: 'Altura del tacón',tipo: 'text',   placeholder: 'Ej: 7 cm' },
    { key: 'punta',        label: 'Tipo de punta',  tipo: 'select', opciones: ['Redonda','Cuadrada','Puntiaguda','Abierta'] },
    { key: 'cierre',       label: 'Cierre',         tipo: 'select', opciones: ['Sin cierre','Cordones','Hebilla','Cremallera','Elástico','Velcro','Slip-on'] },
    { key: 'ocasion',      label: 'Ocasión',        tipo: 'select', opciones: ['Casual','Formal','Trabajo','Playa','Deportivo','Especial / Fiesta'] },
    { key: 'plantilla',    label: 'Plantilla',      tipo: 'select', opciones: ['Cuero','Sintético','Tela','Espuma'] },
    { key: 'suela',        label: 'Suela',          tipo: 'select', opciones: ['Goma','Cuero','Sintético','EVA','Madera'] },
    { key: 'temporada',    label: 'Temporada',      tipo: 'select', opciones: ['Primavera-Verano','Otoño-Invierno','Todo el año'] },
    { key: 'origen',       label: 'País de origen', tipo: 'text',   placeholder: 'Ej: Colombia' },
  ],
  ropa_superior: [
    { key: 'tipo_prenda',  label: 'Tipo',      tipo: 'select', opciones: ['Camiseta','Camisa','Blusa','Polo','Sweater','Hoodie','Top','Chaleco','Chaqueta'] },
    { key: 'cuello',       label: 'Cuello',    tipo: 'select', opciones: ['Redondo','V','Cuadrado','Tortuga','Halter','Camisero','Canalé'] },
    { key: 'manga',        label: 'Manga',     tipo: 'select', opciones: ['Sin manga','Corta','3/4','Larga','Balloon'] },
    { key: 'ajuste',       label: 'Ajuste',    tipo: 'select', opciones: ['Slim','Regular','Oversize','Crop','Entallado'] },
    { key: 'estampado',    label: 'Estampado', tipo: 'select', opciones: ['Liso','Rayas','Cuadros','Flores','Geométrico','Animal print','Tie-dye'] },
    { key: 'cierre',       label: 'Cierre',    tipo: 'select', opciones: ['Sin cierre','Botones','Cremallera','Presión'] },
    { key: 'ocasion',      label: 'Ocasión',   tipo: 'select', opciones: ['Casual','Formal','Trabajo','Sport','Playa','Nocturno'] },
    { key: 'temporada',    label: 'Temporada', tipo: 'select', opciones: ['Primavera-Verano','Otoño-Invierno','Todo el año'] },
    { key: 'lavado',       label: 'Lavado',    tipo: 'select', opciones: ['A mano','Lavadora fría','Lavadora caliente','En seco'] },
    { key: 'origen',       label: 'País de origen', tipo: 'text', placeholder: 'Ej: Colombia' },
  ],
  ropa_inferior: [
    { key: 'tipo_prenda',  label: 'Tipo',      tipo: 'select', opciones: ['Jean','Pantalón','Short','Leggins','Falda','Culotte','Jogger','Bermuda'] },
    { key: 'corte',        label: 'Corte',     tipo: 'select', opciones: ['Slim','Regular','Skinny','Boyfriend','Wide leg','Recto','Bootcut'] },
    { key: 'largo',        label: 'Largo',     tipo: 'select', opciones: ['Corto','Midi','Largo','Maxi','7/8'] },
    { key: 'tiro',         label: 'Tiro',      tipo: 'select', opciones: ['Alto','Medio','Bajo'] },
    { key: 'cierre',       label: 'Cierre',    tipo: 'select', opciones: ['Cremallera','Botón','Elástico','Cordón','Sin cierre'] },
    { key: 'estampado',    label: 'Estampado', tipo: 'select', opciones: ['Liso','Rayas','Cuadros','Flores','Geométrico','Animal print'] },
    { key: 'ocasion',      label: 'Ocasión',   tipo: 'select', opciones: ['Casual','Formal','Trabajo','Sport','Playa','Nocturno'] },
    { key: 'temporada',    label: 'Temporada', tipo: 'select', opciones: ['Primavera-Verano','Otoño-Invierno','Todo el año'] },
    { key: 'lavado',       label: 'Lavado',    tipo: 'select', opciones: ['A mano','Lavadora fría','Lavadora caliente','En seco'] },
    { key: 'origen',       label: 'País de origen', tipo: 'text', placeholder: 'Ej: Colombia' },
  ],
  vestido: [
    { key: 'tipo_prenda',  label: 'Tipo',      tipo: 'select', opciones: ['Vestido','Enterizo','Jumpsuit','Mameluco','Mono'] },
    { key: 'largo',        label: 'Largo',     tipo: 'select', opciones: ['Corto','Midi','Largo','Maxi'] },
    { key: 'cuello',       label: 'Cuello',    tipo: 'select', opciones: ['Redondo','V','Cuadrado','Halter','Bandeau','Off-shoulder'] },
    { key: 'manga',        label: 'Manga',     tipo: 'select', opciones: ['Sin manga','Corta','3/4','Larga'] },
    { key: 'ajuste',       label: 'Ajuste',    tipo: 'select', opciones: ['Slim','Regular','Oversize','Ajustado','Evasé'] },
    { key: 'cierre',       label: 'Cierre',    tipo: 'select', opciones: ['Sin cierre','Cremallera espalda','Cremallera lateral','Botones','Presión'] },
    { key: 'estampado',    label: 'Estampado', tipo: 'select', opciones: ['Liso','Rayas','Flores','Geométrico','Animal print'] },
    { key: 'ocasion',      label: 'Ocasión',   tipo: 'select', opciones: ['Casual','Formal','Trabajo','Playa','Nocturno','Novia / Quinceañera'] },
    { key: 'temporada',    label: 'Temporada', tipo: 'select', opciones: ['Primavera-Verano','Otoño-Invierno','Todo el año'] },
    { key: 'lavado',       label: 'Lavado',    tipo: 'select', opciones: ['A mano','Lavadora fría','En seco'] },
    { key: 'origen',       label: 'País de origen', tipo: 'text', placeholder: 'Ej: Colombia' },
  ],
  accesorio: [
    { key: 'tipo_accesorio', label: 'Tipo',           tipo: 'select', opciones: ['Bolso','Cartera','Mochila','Cinturón','Bufanda','Gorra','Sombrero','Gafas','Joyería','Medias'] },
    { key: 'cierre',         label: 'Cierre',         tipo: 'select', opciones: ['Sin cierre','Cremallera','Magnético','Snap','Hebilla'] },
    { key: 'correa',         label: 'Correa / Asa',   tipo: 'select', opciones: ['Sin asa','Asa corta','Asa larga','Ajustable','Removible'] },
    { key: 'dimensiones',    label: 'Dimensiones',    tipo: 'text',   placeholder: 'Ej: 30×10×20 cm' },
    { key: 'bolsillos',      label: 'Bolsillos',      tipo: 'text',   placeholder: 'Ej: 2 internos, 1 externo' },
    { key: 'ocasion',        label: 'Ocasión',        tipo: 'select', opciones: ['Casual','Formal','Trabajo','Playa','Sport','Nocturno'] },
    { key: 'temporada',      label: 'Temporada',      tipo: 'select', opciones: ['Primavera-Verano','Otoño-Invierno','Todo el año'] },
    { key: 'origen',         label: 'País de origen', tipo: 'text',   placeholder: 'Ej: Colombia' },
  ],
}

function emptyVariant() {
  return { talla: '', color: '', color_hex: '#000000', stock: 0, activo: true }
}

function emptyForm() {
  return {
    cat_id: '', sub_id: '',
    nombre: '', slug: '',
    descripcion: '',
    precio: '',
    ofertaActiva: false, precioOferta: '', ofertaHasta: '',
    ficha_tecnica: { tipo_articulo: '', marca: '', material: '', genero: '' },
    activo: true,
    empaque_id: '',
    variantes: [],
    imagenes: [],  // solo tipo "imagen"
    video: null,   // URL string o null
  }
}

function normalizeVariants(variants) {
  return (variants ?? []).map((v) => ({
    id: v.id ?? null,
    talla: v.talla ?? '',
    color: v.color ?? '',
    color_hex: v.color_hex ?? '#000000',
    stock: Number(v.stock ?? 0),
    activo: v.activo !== false,
  }))
}

/** Campos comunes al producto que aplican a cualquier sección (nunca tocan variantes/imágenes). */
function buildBasePayload(form) {
  return {
    cat_id:  Number(form.cat_id),
    sub_id:  form.sub_id ? Number(form.sub_id) : null,
    nombre:  form.nombre.trim(),
    slug:    form.slug.trim(),
    descripcion: form.descripcion.trim(),
    // Sin oferta: precio = precio normal, precio_antes = null
    // Con oferta: precio = precio oferta (lo que paga el cliente), precio_antes = precio normal
    precio:       form.ofertaActiva ? Number(form.precioOferta) : Number(form.precio),
    precio_antes: form.ofertaActiva ? Number(form.precio) : null,
    oferta_hasta: form.ofertaActiva && form.ofertaHasta ? form.ofertaHasta : null,
    ficha_tecnica: form.ficha_tecnica,
    activo:   form.activo,
    // Empaque (caja) asignado — PLAN_INTEGRACION_ENVIA.md, Fase 1.
    empaque_id: form.empaque_id ? Number(form.empaque_id) : null,
    // sub_id/empaque_id en null por sí solo YA NO lo borra (el backend protege actualizaciones
    // parciales que no tocan estos campos) — estas banderas son la única forma de borrarlos a
    // propósito. Como este payload va completo en cada guardado de sección, siempre reflejan la
    // selección actual: "Sin subcategoría"/"Sin empaque asignado" en el desplegable → true.
    limpiar_sub_id: !form.sub_id,
    limpiar_empaque_id: !form.empaque_id,
  }
}

/** Sube a Cloudinary las imágenes/video pendientes (con _file) y arma la lista final. */
async function uploadPendingMedia(form, productId) {
  const imagenesFinales = []
  for (const img of form.imagenes) {
    if (img._file) {
      const fd = new FormData()
      fd.append('file', img._file)
      fd.append('productId', productId)
      const { url } = await api.upload('/upload/imagen', fd)
      URL.revokeObjectURL(img.url)
      imagenesFinales.push({ url, orden: img.orden, tipo: 'imagen', color: img.color ?? null })
    } else {
      imagenesFinales.push({ url: img.url, orden: img.orden, tipo: img.tipo, color: img.color ?? null })
    }
  }

  let videoUrl = null
  if (form.video) {
    if (form.video._file) {
      const fd = new FormData()
      fd.append('file', form.video._file)
      fd.append('esVideo', 'true')
      fd.append('productId', productId)
      const { url } = await api.upload('/upload/imagen', fd)
      URL.revokeObjectURL(form.video.url)
      videoUrl = url
    } else {
      videoUrl = form.video.url
    }
  }

  return { imagenesFinales, videoUrl }
}

function buildMediaPayload({ imagenesFinales, videoUrl }) {
  return [
    ...imagenesFinales.map((i, idx) => ({ url: i.url, orden: i.orden ?? idx, tipo: 'imagen', color: i.color ?? null })),
    ...(videoUrl ? [{ url: videoUrl, orden: 99, tipo: 'video' }] : []),
  ]
}

/** Tarjeta de sección: en modo edición se vuelve un <form> con su propio botón Guardar. */
function Section({ title, extra, isEdit, status, onSave, children }) {
  const { saving = false, saved = false, error = '' } = status ?? {}
  const body = (
    <div className="section-card p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="text-sm font-bold text-black">{title}</h2>
        {extra}
      </div>
      {children}
      {isEdit && (
        <div className="flex items-center gap-3 justify-end pt-1">
          {error && <p className="text-xs text-red-500 mr-auto">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary text-xs py-2 px-4">
            <Save size={14} />
            {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar'}
          </button>
        </div>
      )}
    </div>
  )
  return isEdit ? <form onSubmit={onSave}>{body}</form> : body
}

export default function ProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(emptyForm())
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [sectionStatus, setSectionStatus] = useState({})
  const [categoryOptions, setCategoryOptions] = useState([{ value: '', label: 'Seleccionar categoría...' }])
  const [subcatOptions, setSubcatOptions] = useState([{ value: '', label: 'Sin subcategoría' }])
  const [empaqueOptions, setEmpaqueOptions] = useState([{ value: '', label: 'Sin empaque asignado' }])
  // Empaque solo es relevante con envío real (Envia.com) activo — con 'contra_entrega'/'fijo'
  // asignarle una caja a un producto no tiene ningún efecto, mostrarlo confundía (ver Settings).
  const [envioModo, setEnvioModo] = useState(null)
  const imgInputRef = useRef(null)
  const vidInputRef = useRef(null)
  const [filtroColorFoto, setFiltroColorFoto] = useState(null)

  useEffect(() => {
    categoryService.getAll().then((data) => {
      const list = Array.isArray(data) ? data : []
      setCategoryOptions([
        { value: '', label: 'Seleccionar categoría...' },
        ...list.map((c) => ({ value: c.id, label: c.nombre })),
      ])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    tiendaConfigService.get()
      .then((cfg) => setEnvioModo(cfg?.envio_modo ?? 'contra_entrega'))
      .catch(() => setEnvioModo('contra_entrega'))
  }, [])

  useEffect(() => {
    empaqueService.getAll().then((data) => {
      const list = Array.isArray(data) ? data : []
      setEmpaqueOptions([
        { value: '', label: 'Sin empaque asignado' },
        ...list.map((e) => ({
          value: e.id,
          label: `${e.nombre} — ${e.largo_cm}×${e.ancho_cm}×${e.alto_cm} cm, ${e.peso_gramos} g${e.activo ? '' : ' (inactivo)'}`,
        })),
      ])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit) return
    productService.getById(id).then((p) => {
      if (!p) return
      const imagenes = (p.imagenes ?? [])
        .filter((i) => i.tipo !== 'video')
        .map((i) => ({ ...i, color: i.color ?? null }))
      const videoItem = (p.imagenes ?? []).find((i) => i.tipo === 'video')
      const loadedForm = {
        cat_id:  p.cat_id ?? '',
        sub_id:  p.sub_id ?? '',
        nombre:  p.nombre,
        slug:    p.slug,
        descripcion: p.descripcion ?? '',
        // Si hay precio_antes → hay oferta: precio_antes es el normal, precio es el oferta
        precio:       p.precio_antes != null ? p.precio_antes : (p.precio ?? ''),
        ofertaActiva: p.precio_antes != null,
        precioOferta: p.precio_antes != null ? (p.precio ?? '') : '',
        ofertaHasta:  p.oferta_hasta ? p.oferta_hasta.slice(0, 16) : '',
        ficha_tecnica: {
          tipo_articulo: '',
          marca:    '',
          material: '',
          genero:   '',
          ...(p.ficha_tecnica ?? {}),  // preserva todos los campos extra ya guardados
        },
        activo: p.activo,
        empaque_id: p.empaque_id ?? '',
        variantes: (p.variantes ?? []).map((v) => ({ ...v })),
        imagenes,
        video: videoItem ? { url: videoItem.url } : null,
      }
      setForm(loadedForm)
      if (p.cat_id) loadSubcats(p.cat_id)
    }).catch(() => {})
  }, [id, isEdit])

  const loadSubcats = (catId) => {
    subcategoryService.getByCat(catId).then((subs) => {
      setSubcatOptions([
        { value: '', label: 'Sin subcategoría' },
        ...(Array.isArray(subs) ? subs : []).map((s) => ({ value: s.id, label: s.nombre })),
      ])
    }).catch(() => {})
  }

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const setFicha = (field) => (e) =>
    setForm((f) => ({ ...f, ficha_tecnica: { ...f.ficha_tecnica, [field]: e.target.value } }))

  const toggleCampo = (key) =>
    setForm((f) => {
      const ft = { ...f.ficha_tecnica }
      if (key in ft) { delete ft[key] } else { ft[key] = '' }
      return { ...f, ficha_tecnica: ft }
    })

  const handleTipoArticulo = (e) => {
    const tipo = e.target.value
    const { tipo_articulo, marca, material, genero, ...extras } = form.ficha_tecnica
    const keysValidos = (CAMPOS_EXTRAS[tipo] ?? []).map((c) => c.key)
    const extrasLimpios = Object.fromEntries(Object.entries(extras).filter(([k]) => keysValidos.includes(k)))
    setForm((f) => ({ ...f, ficha_tecnica: { tipo_articulo: tipo, marca, material, genero, ...extrasLimpios } }))
  }
  const handleNombre = (e) => {
    const nombre = e.target.value
    setForm((f) => ({ ...f, nombre, slug: slugify(nombre) }))
  }
  const handleCat = (e) => {
    const catId = e.target.value
    setForm((f) => ({ ...f, cat_id: catId, sub_id: '' }))
    if (catId) loadSubcats(catId)
    else setSubcatOptions([{ value: '', label: 'Sin subcategoría' }])
  }

  /* ── variantes ─────────────────────────────────────── */
  const addVariant  = () => setForm((f) => ({ ...f, variantes: [...f.variantes, emptyVariant()] }))
  const removeVariant = (idx) => setForm((f) => ({ ...f, variantes: f.variantes.filter((_, i) => i !== idx) }))
  const setVariant  = (idx, field, value) =>
    setForm((f) => ({ ...f, variantes: f.variantes.map((v, i) => i === idx ? { ...v, [field]: value } : v) }))

  /* ── imágenes ──────────────────────────────────────── */
  const handleImgUpload = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const remaining = 5 - form.imagenes.length
    if (remaining <= 0) { alert('Máximo 5 imágenes por producto.'); return }
    const maxOrd = Math.max(0, ...form.imagenes.map((i) => i.orden ?? 0))
    const nuevas = files.slice(0, remaining).map((file, i) => ({
      url: URL.createObjectURL(file),
      _file: file,
      orden: maxOrd + i + 1,
      tipo: 'imagen',
      color: null,
    }))
    setForm((f) => ({ ...f, imagenes: [...f.imagenes, ...nuevas] }))
    if (imgInputRef.current) imgInputRef.current.value = ''
  }

  const removeImage = (idx) => {
    const img = form.imagenes[idx]
    if (img._file) URL.revokeObjectURL(img.url)
    setForm((f) => ({ ...f, imagenes: f.imagenes.filter((_, i) => i !== idx) }))
    // Si esta era la última foto de su color, ese color deja de existir como opción de
    // filtro (se recalcula solo, ver coloresConFotos) — si era el filtro activo, se limpia.
    if (img.color && filtroColorFoto === img.color) {
      const quedanOtras = form.imagenes.some((im, i) => i !== idx && im.color === img.color)
      if (!quedanOtras) setFiltroColorFoto(null)
    }
  }

  /* ── video ─────────────────────────────────────────── */
  const handleVidUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      alert(`El video no puede superar ${MAX_VIDEO_MB} MB.`)
      if (vidInputRef.current) vidInputRef.current.value = ''
      return
    }
    setForm((f) => ({ ...f, video: { url: URL.createObjectURL(file), _file: file } }))
    if (vidInputRef.current) vidInputRef.current.value = ''
  }

  const removeVideo = () => {
    if (form.video?._file) URL.revokeObjectURL(form.video.url)
    setForm((f) => ({ ...f, video: null }))
  }

  /* ── validación ─────────────────────────────────────── */
  const validate = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!form.slug.trim())   e.slug   = 'El slug es obligatorio'
    if (!form.cat_id)        e.cat_id = 'Selecciona una categoría'
    if (!form.precio || isNaN(Number(form.precio))) e.precio = 'Precio inválido'
    if (form.ofertaActiva) {
      if (!form.precioOferta || isNaN(Number(form.precioOferta)))
        e.precioOferta = 'Ingresa el precio de oferta'
      else if (Number(form.precioOferta) >= Number(form.precio))
        e.precioOferta = 'El precio oferta debe ser menor al precio normal'
    }
    // Con envío real (Envia.com) activo, todo producto necesita un empaque para poder
    // cotizarse — si se deja sin asignar, el checkout fallaría en cuanto alguien lo compre.
    if (envioModo === 'envia' && !form.empaque_id) {
      e.empaque_id = 'Con envío real activo, todo producto necesita un empaque asignado'
    }
    return e
  }

  const setStatus = (key, patch) =>
    setSectionStatus((s) => ({ ...s, [key]: { saving: false, saved: false, error: '', ...s[key], ...patch } }))

  /** Guarda una sección específica del producto (solo disponible en modo edición). */
  const saveSection = (key, { withVariantes = false, withMedia = false } = {}) => async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setStatus(key, { saving: true, saved: false, error: '' })
    try {
      const data = buildBasePayload(form)
      if (withVariantes) {
        data.variantes = normalizeVariants(form.variantes)
      }
      if (withMedia) {
        const { imagenesFinales, videoUrl } = await uploadPendingMedia(form, id)
        data.imagenes = buildMediaPayload({ imagenesFinales, videoUrl })
        setForm((f) => ({
          ...f,
          imagenes: imagenesFinales.map((img) => ({ url: img.url, orden: img.orden, tipo: img.tipo, color: img.color ?? null })),
          video: videoUrl ? { url: videoUrl } : null,
        }))
      }
      await productService.update(id, data)
      setStatus(key, { saving: false, saved: true })
      setTimeout(() => setStatus(key, { saved: false }), 2000)
    } catch (err) {
      setStatus(key, { saving: false, error: err.message || 'No se pudo guardar' })
    }
  }

  /** Crea el producto completo (solo aplica cuando aún no existe, o sea !isEdit).
   *  Primero crea el producto (sin medios) para tener un id real, y solo entonces sube las
   *  imágenes/video con ese id — así Cloudinary guarda todo en "productos/{id}" desde el
   *  principio, en vez de en una carpeta "productos/new" que nunca se corrige después. */
  const handleCreate = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      const base = buildBasePayload(form)
      base.variantes = normalizeVariants(form.variantes)
      const created = await productService.create(base)

      const { imagenesFinales, videoUrl } = await uploadPendingMedia(form, created.id)
      if (imagenesFinales.length > 0 || videoUrl) {
        await productService.update(created.id, {
          imagenes: buildMediaPayload({ imagenesFinales, videoUrl }),
        })
      }
      navigate('/productos')
    } catch (err) {
      alert('Error al guardar: ' + err.message)
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/productos')} className="p-2 hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">{isEdit ? 'Editar Producto' : 'Nuevo Producto'}</h1>
          <p className="page-subtitle">{isEdit ? 'Modifica los datos del producto' : 'Agrega un nuevo producto al catálogo'}</p>
        </div>
      </div>

      <div className="space-y-5">

        {/* ── Información básica ── */}
        <Section title="Información básica" isEdit={isEdit} status={sectionStatus.basica} onSave={saveSection('basica')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre del producto" value={form.nombre} onChange={handleNombre} placeholder="Ej: Tenis Urban Pro" error={errors.nombre} />
            <Input label="Slug (URL)" value={form.slug} onChange={set('slug')} placeholder="tenis-urban-pro" error={errors.slug} />
            <Select label="Categoría" value={form.cat_id} onChange={handleCat} options={categoryOptions} error={errors.cat_id} />
            <Select label="Subcategoría" value={form.sub_id} onChange={set('sub_id')} options={subcatOptions} />
          </div>
          <div>
            <label className="label-field">Descripción</label>
            <textarea value={form.descripcion} onChange={set('descripcion')} rows={3}
              placeholder="Describe el producto..." className="input-field resize-none" />
          </div>
        </Section>

        {/* ── Ficha técnica ── */}
        <Section title="Ficha técnica" isEdit={isEdit} status={sectionStatus.ficha} onSave={saveSection('ficha')}>
          {/* Campos base siempre visibles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Marca" value={form.ficha_tecnica.marca} onChange={setFicha('marca')} placeholder="Ej: Nike" />
            <Input label="Material" value={form.ficha_tecnica.material} onChange={setFicha('material')} placeholder="Ej: Cuero, Textil" />
            <div>
              <label className="label-field">Género</label>
              <select value={form.ficha_tecnica.genero} onChange={setFicha('genero')} className="input-field bg-white">
                <option value="">Sin especificar</option>
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="Niño">Niño</option>
                <option value="Niña">Niña</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>
          </div>

          {/* Tipo de artículo → activa campos específicos */}
          <div>
            <label className="label-field">
              Tipo de artículo <span className="font-normal text-gray-400">(activa campos adicionales)</span>
            </label>
            <select value={form.ficha_tecnica.tipo_articulo ?? ''} onChange={handleTipoArticulo} className="input-field bg-white">
              <option value="">Sin especificar</option>
              {TIPOS_ARTICULO.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Campos extra del tipo seleccionado */}
          {(() => {
            const campos = CAMPOS_EXTRAS[form.ficha_tecnica.tipo_articulo] ?? []
            if (!campos.length) return null
            return (
              <div>
                <p className="text-xs text-gray-400 mb-3">Activa los campos que apliquen a este producto</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {campos.map((campo) => {
                    const activo = campo.key in form.ficha_tecnica
                    return (
                      <div key={campo.key}
                        className={`border p-3 transition-colors ${activo ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-semibold ${activo ? 'text-black' : 'text-gray-400'}`}>
                            {campo.label}
                          </span>
                          <button type="button" onClick={() => toggleCampo(campo.key)}
                            className={`relative inline-flex h-5 w-9 items-center transition-colors flex-shrink-0 ${activo ? 'bg-black' : 'bg-gray-200'}`}>
                            <span className={`inline-block h-3.5 w-3.5 transform bg-white transition-transform ${activo ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </button>
                        </div>
                        {activo && (
                          campo.tipo === 'select' ? (
                            <select value={form.ficha_tecnica[campo.key] ?? ''}
                              onChange={setFicha(campo.key)} className="input-field bg-white text-sm">
                              <option value="">Seleccionar…</option>
                              {campo.opciones.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input type="text" value={form.ficha_tecnica[campo.key] ?? ''}
                              onChange={setFicha(campo.key)}
                              placeholder={campo.placeholder}
                              className="input-field text-sm" />
                          )
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </Section>

        {/* ── Precios ── */}
        <Section title="Precios (COP)" isEdit={isEdit} status={sectionStatus.precios} onSave={saveSection('precios')}>
          <Input label="Precio normal" type="number" value={form.precio} onChange={set('precio')}
            placeholder="189900" error={errors.precio} />

          {/* Toggle oferta */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <p className="text-sm font-semibold text-black">Activar oferta</p>
              <p className="text-xs text-gray-400">El cliente pagará el precio de oferta; el normal aparece tachado</p>
            </div>
            <button type="button"
              onClick={() => setForm((f) => ({ ...f, ofertaActiva: !f.ofertaActiva, precioOferta: '', ofertaHasta: '' }))}
              className={`relative inline-flex h-6 w-11 items-center transition-colors ${form.ofertaActiva ? 'bg-black' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform bg-white transition-transform ${form.ofertaActiva ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {form.ofertaActiva && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <Input label="Precio oferta" type="number" value={form.precioOferta}
                onChange={set('precioOferta')} placeholder="149900" error={errors.precioOferta} />
              <div>
                <label className="label-field">Vence el <span className="font-normal text-gray-400">(opcional)</span></label>
                <input type="datetime-local" value={form.ofertaHasta}
                  onChange={(e) => setForm((f) => ({ ...f, ofertaHasta: e.target.value }))}
                  className="input-field" />
                <p className="text-[10px] text-gray-400 mt-1">
                  Si no se establece, la oferta no tiene fecha límite.
                </p>
              </div>
            </div>
          )}
        </Section>

        {/* ── Variantes ── */}
        <Section
          title="Variantes (talla × color × stock)"
          isEdit={isEdit}
          status={sectionStatus.variantes}
          onSave={saveSection('variantes', { withVariantes: true })}
          extra={
            <button type="button" onClick={addVariant} className="btn-secondary text-xs py-1.5">
              <Plus size={13} /> Añadir variante
            </button>
          }
        >
          {form.variantes.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Sin variantes. Cada combinación de talla y color es una variante con su propio stock.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header px-3 py-2 text-left">Talla</th>
                    <th className="table-header px-3 py-2 text-left">Color</th>
                    <th className="table-header px-3 py-2 text-left">Hex</th>
                    <th className="table-header px-3 py-2 text-center">Stock</th>
                    <th className="table-header px-3 py-2 text-center">Activa</th>
                    <th className="table-header px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {form.variantes.map((v, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">
                        <input value={v.talla} onChange={(e) => setVariant(idx, 'talla', e.target.value)}
                          placeholder="38" className="input-field w-20 text-sm" />
                      </td>
                      <td className="px-3 py-2">
                        <input value={v.color} onChange={(e) => setVariant(idx, 'color', e.target.value)}
                          placeholder="Negro" className="input-field w-28 text-sm" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <input type="color" value={v.color_hex}
                            onChange={(e) => setVariant(idx, 'color_hex', e.target.value)}
                            className="w-10 h-9 border border-gray-200 cursor-pointer p-0.5" />
                          <span className="text-xs text-gray-400 font-mono">{v.color_hex}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} value={v.stock}
                          onChange={(e) => setVariant(idx, 'stock', e.target.value)}
                          className="input-field w-20 text-sm text-center" />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={v.activo}
                          onChange={(e) => setVariant(idx, 'activo', e.target.checked)}
                          className="w-4 h-4 accent-black" />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button type="button" onClick={() => removeVariant(idx)}
                          className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ── Imágenes y video ── */}
        <Section
          title="Imágenes y video"
          isEdit={isEdit}
          status={sectionStatus.media}
          onSave={saveSection('media', { withMedia: true })}
        >
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Imágenes <span className="font-normal text-gray-400 normal-case">({form.imagenes.length}/5)</span>
            </p>

            {/* Colores únicos de las variantes para asignar a imágenes — se identifican por el
                nombre del color, no por el id de la variante: una variante recién agregada
                todavía no tiene id (no existe en la BD hasta guardar), pero su color ya se conoce
                de inmediato, así que la imagen sí se puede relacionar con él desde el principio. */}
            {(() => {
              const colores = form.variantes.reduce((acc, v) => {
                if (v.color && !acc.find(c => c.color === v.color))
                  acc.push({ color: v.color, hex: v.color_hex })
                return acc
              }, [])
              // Filtro de fotos por color — solo lista colores que TIENEN al menos una foto
              // (se recalcula de las imágenes, no de las variantes): si se borra la última
              // foto de un color, ese color deja de aparecer aquí automáticamente.
              const coloresConFotos = form.imagenes.reduce((acc, img) => {
                if (img.color && !acc.includes(img.color)) acc.push(img.color)
                return acc
              }, [])
              const imagenesMostradas = form.imagenes
                .map((img, idx) => ({ img, idx }))
                .filter(({ img }) => !filtroColorFoto || img.color === filtroColorFoto)
              return (
                <div>
                  {coloresConFotos.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <button type="button" onClick={() => setFiltroColorFoto(null)}
                        className={`text-[10px] px-2 py-1 border transition-colors ${!filtroColorFoto ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                        Todos
                      </button>
                      {coloresConFotos.map((c) => (
                        <button key={c} type="button" onClick={() => setFiltroColorFoto(c)}
                          className={`text-[10px] px-2 py-1 border transition-colors ${filtroColorFoto === c ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                <div className="flex flex-wrap gap-4">
                  {imagenesMostradas.map(({ img, idx }) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5">
                      <div className="relative group">
                        <img src={img.url} alt="" className={`w-24 h-24 object-cover bg-gray-100 ${img._file ? 'ring-2 ring-offset-1 ring-yellow-400' : ''}`} />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 text-[10px] bg-black text-white px-1.5 py-0.5">
                            Principal
                          </span>
                        )}
                        {img._file && (
                          <span className="absolute top-1 left-1 text-[9px] bg-yellow-400 text-black px-1 py-0.5 font-semibold">
                            Pendiente
                          </span>
                        )}
                        <button type="button" onClick={() => removeImage(idx)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          ×
                        </button>
                      </div>
                      {/* Dropdown de color para esta imagen */}
                      {colores.length > 0 && (
                        <select
                          value={img.color ?? ''}
                          onChange={(e) => setForm((f) => ({
                            ...f,
                            imagenes: f.imagenes.map((im, i) =>
                              i === idx ? { ...im, color: e.target.value || null } : im
                            )
                          }))}
                          className="text-[10px] border border-gray-200 px-1.5 py-1 w-24 bg-white"
                        >
                          <option value="">Todos</option>
                          {colores.map((c) => (
                            <option key={c.color} value={c.color}>
                              {c.color}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}

                  {form.imagenes.length < 5 && (
                    <div className="flex flex-col items-center">
                      <button type="button" onClick={() => imgInputRef.current?.click()}
                        className="w-24 h-24 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-gray-400 hover:bg-gray-50 transition-all">
                        <Upload size={20} className="text-gray-400" />
                        <span className="text-[10px] text-gray-400">Agregar</span>
                      </button>
                    </div>
                  )}
                </div>
                </div>
              )
            })()}

            <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImgUpload} />
            <p className="text-xs text-gray-400 mt-2">La primera imagen es la principal. Las que tienen borde amarillo se suben al guardar.</p>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Video <span className="font-normal text-gray-400 normal-case">(opcional · máx. {MAX_VIDEO_MB} MB)</span>
            </p>

            {form.video ? (
              <div className="flex items-start gap-4">
                <video src={form.video.url} controls className={`w-48 h-28 object-cover bg-black ${form.video._file ? 'ring-2 ring-offset-1 ring-yellow-400' : ''}`} />
                <div className="mt-1 space-y-1">
                  {form.video._file && (
                    <p className="text-[10px] text-yellow-600 font-semibold">Pendiente — se sube al guardar</p>
                  )}
                  <button type="button" onClick={removeVideo}
                    className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700">
                    <X size={13} /> Eliminar video
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => vidInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all text-sm text-gray-500">
                <Video size={16} /> Subir video del producto
              </button>
            )}

            <input ref={vidInputRef} type="file" accept="video/*" className="hidden" onChange={handleVidUpload} />
          </div>
        </Section>

        {/* ── Envío — solo si la tienda tiene activo el envío real (Envia.com) ── */}
        {envioModo === 'envia' && (
          <Section title="Envío" isEdit={isEdit} status={sectionStatus.envio} onSave={saveSection('envio')}>
            <Select label="Empaque (caja) asignado" value={form.empaque_id}
              onChange={set('empaque_id')} options={empaqueOptions} error={errors.empaque_id} />
            <p className="text-xs text-gray-400 -mt-2">
              Necesario para que la tienda pueda cotizar el envío real (Envia.com). Crea o edita
              empaques desde Configuración.
            </p>
          </Section>
        )}

        {/* ── Estado ── */}
        <Section title="Estado del producto" isEdit={isEdit} status={sectionStatus.estado} onSave={saveSection('estado')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-black">Producto activo</p>
              <p className="text-xs text-gray-400">Solo los productos activos son visibles en la tienda</p>
            </div>
            <button type="button" onClick={() => setForm((f) => ({ ...f, activo: !f.activo }))}
              className={`relative inline-flex h-6 w-11 items-center transition-colors ${form.activo ? 'bg-black' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform bg-white transition-transform ${form.activo ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </Section>

        {/* ── Acciones (solo al crear; en edición cada sección guarda por su cuenta) ── */}
        {!isEdit && (
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/productos')} className="btn-secondary">Cancelar</button>
            <button type="button" onClick={handleCreate} disabled={saving} className="btn-primary">
              <Save size={15} />
              {saving ? 'Guardando...' : 'Crear producto'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
