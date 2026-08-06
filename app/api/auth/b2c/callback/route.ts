import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { user, type Role } from '@/lib/db/schema'
import {
  verifyIdToken,
  extractIdentity,
  isColaborador,
  b2cConfigured,
  type B2CClaims,
} from '@/lib/b2c'
import { setSessionCookie } from '@/lib/b2c-session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Recibe el id_token (canjeado por el cliente vía PKCE), lo valida contra las
// claves públicas del tenant, resuelve el usuario en Neon y crea la sesión.
export async function POST(request: Request) {
  if (!b2cConfigured()) {
    return NextResponse.json(
      { error: 'La autenticación de Azure AD B2C no está configurada.' },
      { status: 500 },
    )
  }

  let body: { idToken?: string; nonce?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }

  const { idToken, nonce } = body
  if (!idToken || !nonce) {
    return NextResponse.json(
      { error: 'La sesión de inicio expiró. Volvé a intentar.' },
      { status: 400 },
    )
  }

  // Validación completa del token en el servidor (firma, issuer, audience, exp, nonce).
  let payload: B2CClaims
  try {
    payload = (await verifyIdToken(idToken, nonce)) as B2CClaims
  } catch (err) {
    console.error('[v0] b2c verifyIdToken error:', err)
    return NextResponse.json({ error: 'El token no es válido.' }, { status: 401 })
  }

  // Log temporal de claims: sirve para confirmar cómo llega el email/nombre
  // durante los primeros logins reales. Quitar luego.
  console.log('[v0] entra claims recibidos:', JSON.stringify(payload))

  const { b2cId, email, name } = extractIdentity(payload)
  if (!b2cId || !email) {
    return NextResponse.json(
      { error: 'El token no contiene los datos de usuario esperados.' },
      { status: 400 },
    )
  }

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
    // Colaborador confirmado por el token: asegurar rol colaborador (sin tocar admin).
    // Clientes: se conserva el rol que ya tienen en Neon.
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

  // Crear la sesión propia del Centro de Recursos.
  await setSessionCookie({ userId, b2cId })

  return NextResponse.json({ ok: true, redirect: '/' })
}
