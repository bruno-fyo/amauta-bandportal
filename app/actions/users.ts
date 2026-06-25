'use server'

import { revalidatePath } from 'next/cache'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { user, ROLES, type Role } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/session'

export type ActionResult = { ok: true } | { ok: false; error: string }

export type ManagedUser = {
  id: string
  name: string
  email: string
  role: Role
  createdAt: Date
}

// Lista de usuarios para el panel de administración. Solo admin.
export async function getUsers(): Promise<ManagedUser[]> {
  await requireAdmin()
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
  return rows.map((r) => ({ ...r, role: r.role as Role }))
}

// Crear una cuenta nueva con su rol. Solo admin.
export async function createUser(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()

    const name = String(formData.get('name') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim().toLowerCase()
    const password = String(formData.get('password') ?? '')
    const role = String(formData.get('role') ?? 'comercial') as Role

    if (!name) return { ok: false, error: 'El nombre es obligatorio.' }
    if (!email || !email.includes('@'))
      return { ok: false, error: 'Ingresá un correo electrónico válido.' }
    if (password.length < 8)
      return { ok: false, error: 'La contraseña debe tener al menos 8 caracteres.' }
    if (!ROLES.includes(role)) return { ok: false, error: 'Rol inválido.' }

    const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email))
    if (existing.length > 0)
      return { ok: false, error: 'Ya existe una cuenta con ese correo.' }

    // Better Auth crea el usuario y hashea la contraseña.
    // No reenviamos headers para no afectar la sesión del admin.
    const created = await auth.api.signUpEmail({
      body: { name, email, password },
    })

    if (!created?.user?.id)
      return { ok: false, error: 'No se pudo crear la cuenta.' }

    // Asignamos el rol elegido por el admin.
    await db
      .update(user)
      .set({ role, updatedAt: new Date() })
      .where(eq(user.id, created.user.id))

    revalidatePath('/admin')
    return { ok: true }
  } catch (err) {
    console.error('[v0] createUser error:', err)
    const message = err instanceof Error ? err.message.toLowerCase() : ''
    if (message.includes('already') || message.includes('exist'))
      return { ok: false, error: 'Ya existe una cuenta con ese correo.' }
    return { ok: false, error: 'No se pudo crear la cuenta. Verificá los datos e intentá de nuevo.' }
  }
}

// Eliminar un usuario. Solo admin.
export async function deleteUser(userId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    if (admin.id === userId)
      return { ok: false, error: 'No podés eliminar tu propia cuenta.' }

    await db.delete(user).where(eq(user.id, userId))
    revalidatePath('/admin')
    return { ok: true }
  } catch (err) {
    console.error('[v0] deleteUser error:', err)
    return { ok: false, error: 'No se pudo eliminar la cuenta.' }
  }
}

// Cambiar el rol de un usuario. Solo admin.
export async function updateUserRole(
  userId: string,
  role: Role,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    if (!ROLES.includes(role)) return { ok: false, error: 'Rol inválido.' }
    if (admin.id === userId)
      return { ok: false, error: 'No podés cambiar tu propio rol.' }

    await db.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, userId))
    revalidatePath('/admin')
    return { ok: true }
  } catch (err) {
    console.error('[v0] updateUserRole error:', err)
    return { ok: false, error: 'No se pudo actualizar el rol.' }
  }
}
