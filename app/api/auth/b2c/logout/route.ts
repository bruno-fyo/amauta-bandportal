import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session-token'

// Cierre de sesión LOCAL: borra la cookie propia (amauta_session) y redirige
// directo a /login, sin pasar por el logout de Microsoft.
//
// No cerramos la sesión SSO de Entra a propósito: hacerlo requiere una
// post-logout redirect URI registrada en el App Registration, y no podemos
// tocar Azure. No hace falta igual: el login envía `prompt=select_account`,
// así que el próximo ingreso siempre pide elegir cuenta (no hay auto-login
// silencioso).
export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/login', req.url))
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
