import { NextResponse } from 'next/server'
import { b2cConfigured, buildAuthorizeUrl } from '@/lib/b2c'
import { createPkcePair, randomUrlSafe } from '@/lib/pkce'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Inicio del flujo Authorization Code + PKCE (server-side).
// Genera verifier/challenge + state + nonce en el backend, guarda los secretos
// del handshake en cookies HttpOnly de un solo uso (no accesibles por JS) y
// redirige al usuario a la pantalla de login corporativo de Microsoft. El
// navegador nunca ve la config de OAuth ni el code_verifier.
export async function GET(request: Request) {
  if (!b2cConfigured()) {
    return NextResponse.redirect(new URL('/login?error=b2c_no_config', request.url))
  }

  const { verifier, challenge } = await createPkcePair()
  const state = randomUrlSafe(32)
  const nonce = randomUrlSafe(32)

  const authorizeUrl = buildAuthorizeUrl({ challenge, state, nonce })
  const res = NextResponse.redirect(authorizeUrl)

  // Cookies del handshake: HttpOnly + Secure + SameSite=Lax (deben viajar en la
  // navegación top-level GET de vuelta desde Microsoft). Vida corta (10 min) y
  // de un solo uso: el callback las borra apenas las consume.
  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 600,
  }
  res.cookies.set('b2c_verifier', verifier, cookieOpts)
  res.cookies.set('b2c_state', state, cookieOpts)
  res.cookies.set('b2c_nonce', nonce, cookieOpts)

  return res
}
