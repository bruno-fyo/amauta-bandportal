import 'server-only'
import { cookies } from 'next/headers'
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
  type AppSession,
} from './session-token'

// Helpers de cookie para la sesión propia del Centro de Recursos.
// Cookie HttpOnly + Secure + SameSite=Lax, tal como exige la especificación.

export async function setSessionCookie(data: AppSession): Promise<void> {
  const token = await signSession(data)
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export async function getSessionFromCookie(): Promise<AppSession | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySession(token)
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}
