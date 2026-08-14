/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Optimización activada: Next redimensiona y convierte a WebP/AVIF bajo
    // demanda. Las miniaturas de productos viven en Vercel Blob, así que hay
    // que permitir ese origen remoto.
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  async headers() {
    return [
      {
        // Plantillas de página personalizadas para Azure AD B2C.
        // Azure las carga por AJAX, por lo que requieren CORS habilitado.
        source: '/b2c/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]
  },
}

export default nextConfig
