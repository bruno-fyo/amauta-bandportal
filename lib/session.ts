import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user, type Role } from '@/lib/db/schema'
import { getSessionFromCookie } from '@/lib/b2c-session'
import { canAccessCategory, type CategoryKey } from '@/lib/categories'

export type SessionUser = {
  id: string
  name: string
  email: string
  role: Role
  image?: string | null
}

// Devuelve el usuario de la sesión actual o null si no hay sesión.
// Reconoce dos tipos de sesión:
//   1. Sesión propia de B2C (cookie amauta_session) — colaboradores y clientes
//      que ya ingresan por Azure AD B2C. El rol se relee siempre desde Neon.
//   2. Sesión de Better Auth (email/contraseña) — clientes legacy aún no
//      migrados a B2C. Se mantiene en paralelo durante la transición.
export async function getCurrentUser(): Promise<SessionUser | null> {
  // 1) Sesión propia de B2C.
  const appSession = await getSessionFromCookie()
  if (appSession) {
    const rows = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      })
      .from(user)
      .where(eq(user.id, appSession.userId))
      .limit(1)
    const u = rows[0]
    // Si el usuario ya no existe en Neon, la sesión es inválida (bloqueado/eliminado).
    if (u) {
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: (u.role as Role) ?? 'colaborador',
        image: u.image,
      }
    }
  }

  // 2) Sesión de Better Auth (clientes legacy).
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const u = session.user as typeof session.user & { role?: string }
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: (u.role as Role) ?? 'colaborador',
    image: u.image,
  }
}

// Exige una sesión válida; si no existe, redirige a /login.
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

// Exige rol admin; si no lo es, redirige a la página de acceso restringido.
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role !== 'admin') redirect('/acceso-restringido')
  return user
}

// Exige acceso a una categoría del portal; si el rol no la puede ver, redirige
// al dashboard. Protege el acceso directo por URL a categorías restringidas.
export async function requireCategoryAccess(
  key: CategoryKey,
): Promise<SessionUser> {
  const user = await requireUser()
  if (!canAccessCategory(user.role, key)) redirect('/acceso-restringido')
  return user
}
