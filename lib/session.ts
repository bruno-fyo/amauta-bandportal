import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import type { Role } from '@/lib/db/schema'

export type SessionUser = {
  id: string
  name: string
  email: string
  role: Role
  image?: string | null
}

// Devuelve el usuario de la sesión actual o null si no hay sesión.
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const u = session.user as typeof session.user & { role?: string }
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: (u.role as Role) ?? 'comercial',
    image: u.image,
  }
}

// Exige una sesión válida; si no existe, redirige a /login.
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

// Exige rol admin; si no lo es, redirige al dashboard.
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role !== 'admin') redirect('/')
  return user
}
