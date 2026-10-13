export function formatCurrency(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value ?? 0)
}

export function formatDate(dateStr) {
  if (!dateStr) return '-'
  return dateStr   // backend ya envía "dd/MM/yyyy HH:mm" (zona Bogotá)
}

export function formatNumber(value) {
  return new Intl.NumberFormat('es-CO').format(value)
}

export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}
