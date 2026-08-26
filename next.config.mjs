// ---------------------------------------------------------------------------
// Content Security Policy (enforcing).
// Allowlist construida a partir de lo que el navegador realmente contacta:
//  - script/style 'unsafe-inline': Next.js App Router inyecta scripts de
//    hidratación y estilos inline; sin nonce, quitarlo rompe la app. (Mejora
//    futura: nonces vía middleware.)
//  - va.vercel-scripts.com: script de Vercel Analytics (solo en producción).
//  - *.public.blob.vercel-storage.com: imágenes de productos/recursos en Blob.
//  - login.microsoftonline.com: fetch del token endpoint (canje PKCE en el
//    navegador) + navegación/iframe del SSO de Entra ID.
//  - font 'self': next/font hospeda las fuentes en el propio origen.
// ---------------------------------------------------------------------------
const isDev = process.env.NODE_ENV === 'development'

// 'unsafe-eval' SOLO en desarrollo: React lo usa para features de depuración en
// dev, pero nunca en producción. Así el bundle de producción queda estricto.
const scriptSrc = [
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  isDev ? "'unsafe-eval'" : '',
]
  .filter(Boolean)
  .join(' ')

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
  "media-src 'self' blob: https://*.public.blob.vercel-storage.com",
  "manifest-src 'self'",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  scriptSrc,
  "connect-src 'self' https://login.microsoftonline.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
  "form-action 'self' https://login.microsoftonline.com",
  "frame-src 'self' https://login.microsoftonline.com",
  "worker-src 'self' blob:",
  'upgrade-insecure-requests',
].join('; ')

// Cabeceras base seguras para cualquier ruta (no afectan contenido embebido/AJAX).
const baselineSecurityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // No revelar el framework en las respuestas.
  poweredByHeader: false,
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
        // Cabeceras base en TODAS las rutas.
        source: '/:path*',
        headers: baselineSecurityHeaders,
      },
      {
        // CSP + anti-clickjacking en todo MENOS /b2c/* (las plantillas del SSO
        // que Azure carga por AJAX; se dejan intactas para no romper el login).
        source: '/((?!b2c/).*)',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
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
