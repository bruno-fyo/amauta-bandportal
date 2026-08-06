import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Compatibilidad: el inicio del flujo ahora es client-side (Authorization Code
// + PKCE) desde el botón de la pantalla de login. Cualquier acceso directo a
// esta ruta se redirige a /login, donde está el botón que inicia el flujo.
export async function GET(request: Request) {
  return NextResponse.redirect(new URL('/login', request.url))
}
