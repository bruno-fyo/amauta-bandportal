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
import { setSessionCookie } from '@/lib/b2c-session'

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
  const loginError = (code: string) =>
    NextResponse.redirect(new URL(`/login?error=${code}`, url.origin))

  if (!b2cConfigured()) return loginError('b2c_no_config')

  const code = url.searchParams.get('code')
  const returnedState = url.searchParams.get('state')
  const oauthError = url.searchParams.get('error')

  if (oauthError) return loginError('oauth')
  if (!code || !returnedState) return loginError('sin_code')

  // Recuperar y consumir (borrar) las cookies del handshake.
  const store = await cookies()
  const verifier = store.get('b2c_verifier')?.value
  const savedState = store.get('b2c_state')?.value
  const nonce = store.get('b2c_nonce')?.value
  for (const name of ['b2c_verifier', 'b2c_state', 'b2c_nonce']) {
    store.delete(name)
  }

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

  // 3) Crear la sesión propia del Centro de Recursos (cookie HttpOnly).
  await setSessionCookie({ userId, b2cId })

  return NextResponse.redirect(new URL('/', url.origin))
}
