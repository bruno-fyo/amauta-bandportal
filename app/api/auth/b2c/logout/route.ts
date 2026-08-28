import { NextResponse, type NextRequest } from 'next/server'
import { b2cConfigured } from '@/lib/b2c'
import { SESSION_COOKIE } from '@/lib/session-token'

const AUTHORITY_LOGOUT = `https://login.microsoftonline.com/${
  process.env.AZURE_TENANT_ID || '9757942a-1dcd-45b3-ba22-2e5bdbc49b3c'
}/oauth2/v2.0/logout`

// A dónde vuelve Microsoft después de cerrar la sesión de Entra. Debe coincidir
// EXACTAMENTE con una "post logout redirect URI" registrada en el App
// Registration (bloque Web). Se fija acá (igual que REDIRECT_URI en lib/b2c.ts)
// para no depender de la env var, que traía un path desactualizado.
const POST_LOGOUT_REDIRECT_URI = 'https://recursos.amauta.ag/login'

// Cierra sesión y termina en nuestro /login.
// 1) Borra la cookie propia (amauta_session) en el redirect de salida.
// 2) Si Entra está configurado, va al logout del proveedor pidiéndole que, al
//    terminar, redirija directo a /login (post_logout_redirect_uri registrado).
//    Si no, va directo a /login.
export async function GET(req: NextRequest) {
  let target = new URL('/login', req.url).toString()

  if (b2cConfigured()) {
    const params = new URLSearchParams({
      post_logout_redirect_uri: POST_LOGOUT_REDIRECT_URI,
    })
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
