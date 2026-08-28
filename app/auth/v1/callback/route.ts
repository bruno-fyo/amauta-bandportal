import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { user, type Role } from '@/lib/db/schema'
import {
  b2cConfigured,
  exchangeCodeForIdToken,
  verifyIdToken,
  extractIdentity,
  isColaborador,
  type B2CClaims,
} from '@/lib/b2c'
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
} from '@/lib/session-token'

const HANDSHAKE_COOKIES = ['b2c_verifier', 'b2c_state', 'b2c_nonce'] as const

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Retorno del flujo Authorization Code + PKCE (Entra ID), 100% server-side.
// Microsoft redirige acá con ?code=&state=. Todo ocurre en el backend:
//  1) validar state contra la cookie del handshake
//  2) canjear el code por el id_token (server-to-server, con secret + verifier)
//  3) validar el id_token (firma, issuer, audience, exp, nonce)
//  4) resolver/crear el usuario en Neon y crear la sesión propia (cookie HttpOnly)
// El navegador nunca ve el code_verifier ni los tokens de Microsoft.
export async function GET(request: Request) {
  const url = new URL(request.url)

  // IMPORTANTE: en un route handler, las cookies deben escribirse sobre el
  // MISMO NextResponse que se devuelve. Mutar el store de next/headers y luego
  // devolver un NextResponse.redirect nuevo NO adjunta esos Set-Cookie → la
  // sesión no se persiste y el usuario vuelve al login. Por eso acá todo write
  // de cookie va sobre el objeto `res`.
  const loginError = (code: string) => {
    const res = NextResponse.redirect(new URL(`/login?error=${code}`, url.origin))
    for (const name of HANDSHAKE_COOKIES) res.cookies.delete(name)
    return res
  }

  if (!b2cConfigured()) return loginError('b2c_no_config')

  const code = url.searchParams.get('code')
  const returnedState = url.searchParams.get('state')
  const oauthError = url.searchParams.get('error')

  if (oauthError) return loginError('oauth')
  if (!code || !returnedState) return loginError('sin_code')

  // Leer las cookies del handshake (la lectura del store de entrada sí es
  // confiable; solo las escrituras deben ir sobre la respuesta).
  const store = await cookies()
  const verifier = store.get('b2c_verifier')?.value
  const savedState = store.get('b2c_state')?.value
  const nonce = store.get('b2c_nonce')?.value

  if (!verifier || !savedState || !nonce) return loginError('sesion_expirada')
  if (returnedState !== savedState) return loginError('state_invalido')

  // 1) Canje del code por el id_token (confidencial: secret + PKCE verifier).
  let idToken: string
  try {
    idToken = await exchangeCodeForIdToken({ code, verifier })
  } catch (err) {
    console.error('[v0] b2c token exchange error:', err)
    return loginError('token')
  }

  // 2) Validación completa del token en el servidor.
  let payload: B2CClaims
  try {
    payload = (await verifyIdToken(idToken, nonce)) as B2CClaims
  } catch (err) {
    console.error('[v0] b2c verifyIdToken error:', err)
    return loginError('token_invalido')
  }

  const { b2cId, email, name } = extractIdentity(payload)
  if (!b2cId || !email) return loginError('sin_datos')

  const colaborador = isColaborador(payload)
  const now = new Date()

  // find-or-create: 1) por b2cId  2) por email (vincular legacy)  3) crear.
  let record = (
    await db.select().from(user).where(eq(user.b2cId, b2cId)).limit(1)
  )[0]
  if (!record) {
    record = (
      await db.select().from(user).where(eq(user.email, email)).limit(1)
    )[0]
  }

  let userId: string
  if (record) {
    userId = record.id
    const updates: Partial<typeof user.$inferInsert> = {
      b2cId,
      lastLoginAt: now,
      updatedAt: now,
    }
    // Colaborador confirmado por el token: asegurar rol (sin degradar admin).
    if (colaborador && record.role !== 'admin') {
      updates.role = 'colaborador' satisfies Role
    }
    await db.update(user).set(updates).where(eq(user.id, userId))
  } else {
    // Usuario nuevo. No se asigna admin automáticamente.
    userId = crypto.randomUUID()
    await db.insert(user).values({
      id: userId,
      name,
      email,
      emailVerified: true,
      role: 'colaborador',
      b2cId,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    })
  }

  // 3) Crear la sesión propia del Centro de Recursos y redirigir a la home.
  // La cookie de sesión + el borrado del handshake van sobre el MISMO response.
  const token = await signSession({ userId, b2cId })
  const res = NextResponse.redirect(new URL('/', url.origin))
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  for (const name of HANDSHAKE_COOKIES) res.cookies.delete(name)
  return res
}
