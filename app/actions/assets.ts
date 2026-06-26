'use server'

import { revalidatePath } from 'next/cache'
import { put, del } from '@vercel/blob'
import { and, arrayContains, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { assets, type Asset, type Role } from '@/lib/db/schema'
import { getCurrentUser, requireAdmin } from '@/lib/session'

export type ActionResult = { ok: true } | { ok: false; error: string }

// Lectura de assets visibles para el rol del usuario actual, opcionalmente
// filtrados por categoría. Los admin ven todo.
export async function getAssetsForUser(category?: string): Promise<Asset[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const filters = []
  if (category) filters.push(eq(assets.category, category))
  // Filtro de visibilidad por rol (los admin omiten el filtro).
  if (user.role !== 'admin') {
    filters.push(arrayContains(assets.visibility, [user.role]))
  }

  return db
    .select()
    .from(assets)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(assets.createdAt))
}

// Conteo de assets por categoría visibles para el usuario.
export async function getAssetCounts(): Promise<Record<string, number>> {
  const rows = await getAssetsForUser()
  return rows.reduce<Record<string, number>>((acc, a) => {
    acc[a.category] = (acc[a.category] ?? 0) + 1
    return acc
  }, {})
}

// Todos los assets (solo admin) para el panel de administración.
export async function getAllAssets(): Promise<Asset[]> {
  await requireAdmin()
  return db.select().from(assets).orderBy(desc(assets.createdAt))
}

// Crear un asset subiendo el archivo a Vercel Blob (privado). Solo admin.
export async function createAsset(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()

    const title = String(formData.get('title') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const category = String(formData.get('category') ?? '').trim()
    const fileType = String(formData.get('fileType') ?? '').trim()
    const tagsRaw = String(formData.get('tags') ?? '').trim()
    const visibility = formData.getAll('visibility').map(String) as Role[]
    const file = formData.get('file') as File | null

    if (!title) return { ok: false, error: 'El título es obligatorio.' }
    if (!category) return { ok: false, error: 'Seleccioná una categoría.' }
    if (!fileType) return { ok: false, error: 'Seleccioná el tipo de archivo.' }
    if (visibility.length === 0)
      return { ok: false, error: 'Seleccioná al menos un rol con visibilidad.' }
    if (!file || file.size === 0)
      return { ok: false, error: 'Adjuntá un archivo para cargar.' }

    const tags = tagsRaw
      ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return {
        ok: false,
        error:
          'El almacenamiento de archivos (Vercel Blob) todavía no está conectado. Conectá la integración Blob desde Ajustes para poder subir archivos.',
      }
    }

    // Subida a Vercel Blob.
    const blob = await put(`assets/${category}/${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true,
    })

    await db.insert(assets).values({
      title,
      description: description || null,
      category,
      fileType,
      fileName: file.name,
      filePathname: blob.pathname,
      fileUrl: blob.url,
      fileSize: file.size,
      tags,
      visibility,
      uploadedBy: admin.id,
    })

    revalidatePath('/admin')
    revalidatePath('/')
    return { ok: true }
  } catch (err) {
    console.error('[v0] createAsset error:', err)
    return { ok: false, error: 'No se pudo cargar el material. Intentá de nuevo.' }
  }
}

// Eliminar un asset y su archivo en Blob. Solo admin.
export async function deleteAsset(id: number): Promise<ActionResult> {
  try {
    await requireAdmin()
    const [row] = await db.select().from(assets).where(eq(assets.id, id))
    if (!row) return { ok: false, error: 'El material ya no existe.' }

    if (row.fileUrl) {
      try {
        await del(row.fileUrl)
      } catch (e) {
        console.error('[v0] blob del error:', e)
      }
    }

    await db.delete(assets).where(eq(assets.id, id))
    revalidatePath('/admin')
    revalidatePath('/')
    return { ok: true }
  } catch (err) {
    console.error('[v0] deleteAsset error:', err)
    return { ok: false, error: 'No se pudo eliminar el material.' }
  }
}
