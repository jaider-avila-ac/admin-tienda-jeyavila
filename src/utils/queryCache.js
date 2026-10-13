// Caché en memoria (vive mientras dure la sesión del SPA) para el patrón
// stale-while-revalidate: se pinta lo último visto al instante mientras
// se refresca en segundo plano contra el servidor.
const cache = new Map()

export function getCached(key) {
  return cache.has(key) ? cache.get(key) : undefined
}

export function setCached(key, value) {
  cache.set(key, value)
}
