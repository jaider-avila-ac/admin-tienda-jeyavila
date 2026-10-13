import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  // Solo en desarrollo (npm run dev): la API de producción no acepta peticiones desde
  // localhost (CORS), así que Vite las reenvía él mismo. En .env.development, VITE_API_URL apunta
  // a este mismo servidor y VITE_API_DESTINO al backend real. Se quita el Origin para que el
  // backend la trate como una petición de servidor a servidor. No afecta al build de producción.
  const destino = env.VITE_API_DESTINO || 'https://manzana.calzacaribe.com'
  const proxy = {
    target: destino,
    changeOrigin: true,
    secure: true,
    configure: (p) => p.on('proxyReq', (req) => req.removeHeader('origin')),
  }
  return {
    plugins: [react()],
    define: {
      global: 'globalThis',
    },
    server: {
      port: 5181, // el mismo de VITE_API_URL en .env.development
      // Todas las direcciones (IPv4 e IPv6): "localhost" puede resolverse a 127.0.0.1 o a ::1
      // según el navegador, y Vite por defecto solo escucha en una de ellas.
      host: true,
      strictPort: true,
      proxy: { '/api': proxy, '/ws': { ...proxy, ws: true } },
    },
  }
})
