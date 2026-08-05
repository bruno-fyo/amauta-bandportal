import { NextResponse } from 'next/server'
import { buildAuthorizeUrl, b2cConfigured } from '@/lib/b2c'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Inicia el flujo de Azure AD B2C: genera nonce y state seguros, los guarda en
// cookies HttpOnly temporales y redirige a la pantalla de login alojada en B2C.
export async function GET() {
  if (!b2cConfigured()) {
    return NextResponse.json(
      { error: 'La autenticación de Azure AD B2C no está configurada.' },
      { status: 500 },
    )
  }

  const nonce = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, '')
  const state = crypto.randomUUID()

  const res = NextResponse.redirect(buildAuthorizeUrl({ nonce, state }))
  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 10, // 10 minutos para completar el login
  }
  res.cookies.set('b2c_nonce', nonce, cookieOpts)
  res.cookies.set('b2c_state', state, cookieOpts)
  return res
}
