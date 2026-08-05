import { NextResponse, type NextRequest } from 'next/server'
import { buildLogoutUrl, b2cConfigured } from '@/lib/b2c'
import { SESSION_COOKIE } from '@/lib/session-token'

// Cierra la sesión propia de la app (borra la cookie amauta_session) y, si B2C
// está configurado, continúa al logout de Azure AD B2C para cerrar también la
// sesión del lado del proveedor. Si no, vuelve a /login.
export async function GET(req: NextRequest) {
  const target = b2cConfigured()
    ? buildLogoutUrl()
    : new URL('/login', req.url).toString()

  const res = NextResponse.redirect(target)
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
