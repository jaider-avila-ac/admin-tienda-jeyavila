import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'

/** Confirmación con diseño propio — reemplaza al confirm() nativo del navegador (fea, no se
 *  puede personalizar, y en algunos navegadores/dispositivos ni siquiera se ve bien).
 *  `warning` es un bloque aparte para avisos específicos (ej. "esto también borra tus reseñas"),
 *  separado del mensaje principal. `danger` pone el botón de confirmar en rojo — para acciones
 *  destructivas (borrar) en vez del negro por defecto. */
export default function ConfirmModal({
  open, onClose, onConfirm, title = 'Confirmar', message, warning, error,
  confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false, loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        {message && <p className="text-sm text-gray-600">{message}</p>}

        {warning && (
          <div className="flex gap-2.5 p-3 bg-red-50 border border-red-100 text-sm text-red-700">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <p>{warning}</p>
          </div>
        )}

        {/* Distinto de `warning` (aviso previo, antes de intentar) — esto es un fallo real de
            la acción, para que nunca quede en silencio ni el modal colgado sin explicación. */}
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={onClose} disabled={loading} className="btn-secondary text-sm disabled:opacity-50">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`text-sm px-4 py-2 font-semibold text-white transition-colors disabled:opacity-50 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-gray-800'
            }`}
          >
            {loading ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
