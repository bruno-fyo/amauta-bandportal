import { NextResponse, type NextRequest } from 'next/server'
import { b2cConfigured } from '@/lib/b2c'
import { SESSION_COOKIE } from '@/lib/session-token'

const AUTHORITY_LOGOUT = `https://login.microsoftonline.com/${
  process.env.AZURE_TENANT_ID || '9757942a-1dcd-45b3-ba22-2e5bdbc49b3c'
}/oauth2/v2.0/logout`

// Cierra sesión y SIEMPRE termina en nuestro /login.
// Paso 1 (sin ?done): borra la cookie propia (amauta_session) y, si Entra está
//   configurado, va al logout del proveedor pidiéndole que vuelva a esta misma
//   ruta con ?done=1.
// Paso 2 (?done=1): ya cerró en Entra; redirige definitivamente a /login.
export async function GET(req: NextRequest) {
  const done = req.nextUrl.searchParams.get('done')
  const loginUrl = new URL('/login', req.url).toString()

  // Segundo paso: volvió desde Entra, ir al login final.
  if (done) {
    return NextResponse.redirect(loginUrl)
  }

  let target = loginUrl
  if (b2cConfigured()) {
    // Pedimos a Entra que, tras cerrar sesión, vuelva a esta ruta con ?done=1.
    const returnUri = new URL('/api/auth/b2c/logout?done=1', req.url).toString()
    const params = new URLSearchParams({ post_logout_redirect_uri: returnUri })
    target = `${AUTHORITY_LOGOUT}?${params.toString()}`
  }

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
