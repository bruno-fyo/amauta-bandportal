import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/session-token'

// Rutas públicas que no requieren sesión.
const PUBLIC_PATHS = [
  '/login', // pantalla de ingreso (email/contraseña + botón B2C)
  '/auth/callback', // retorno de B2C
  '/acceso-interno', // respaldo transitorio: login legacy email/contraseña
  '/acceso-restringido', // rol insuficiente
]

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  // Better Auth (/api/auth/*) y B2C (/api/auth/b2c/*) deben ser accesibles.
  if (pathname.startsWith('/api/auth')) return true
  return false
}

// ¿Tiene el usuario alguna sesión válida?
async function hasSession(req: NextRequest): Promise<boolean> {
  // 1) Sesión propia de B2C (verificamos firma del JWT).
  const appToken = req.cookies.get(SESSION_COOKIE)?.value
  if (appToken && (await verifySession(appToken))) return true

  // 2) Sesión de Better Auth (clientes legacy). El chequeo completo lo hace el
  //    servidor; en el middleware basta con detectar la cookie de sesión.
  const hasLegacy = req.cookies
    .getAll()
    .some((c) => c.name.includes('better-auth') && Boolean(c.value))
  return hasLegacy
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isPublic(pathname)) return NextResponse.next()
  if (await hasSession(req)) return NextResponse.next()

  // Sin sesión: las llamadas a API devuelven 401 (no redirección HTML).
  if (pathname.startsWith('/api')) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  // Resto: redirigir a nuestra pantalla de ingreso (email/contraseña + botón B2C).
  const loginUrl = new URL('/login', req.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  // Se ejecuta en todo excepto assets estáticos y archivos con extensión.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|products/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|html|txt|xml|json|woff|woff2|ttf|mp4|mp3)$).*)',
  ],
}
