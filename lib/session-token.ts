import { SignJWT, jwtVerify } from 'jose'

// Sesión propia del Centro de Recursos (independiente de Better Auth).
// Este módulo es runtime-agnóstico (no usa next/headers) para poder usarse
// tanto en Server Components / Route Handlers como en el middleware (Edge).

export const SESSION_COOKIE = 'amauta_session'
export const SESSION_MAX_AGE = 60 * 60 * 8 // 8 horas

export type AppSession = {
  userId: string
  b2cId: string | null
}

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET || process.env.BETTER_AUTH_SECRET
  if (!s) throw new Error('[session] Falta SESSION_SECRET o BETTER_AUTH_SECRET')
  return new TextEncoder().encode(s)
}

// Firma un token de sesión (HS256, 8h).
export async function signSession(data: AppSession): Promise<string> {
  return new SignJWT({ userId: data.userId, b2cId: data.b2cId ?? null })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret())
}

// Verifica y decodifica un token de sesión. Devuelve null si es inválido.
export async function verifySession(token: string): Promise<AppSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    if (!payload.userId) return null
    return {
      userId: String(payload.userId),
      b2cId: payload.b2cId ? String(payload.b2cId) : null,
    }
  } catch {
    return null
  }
}
