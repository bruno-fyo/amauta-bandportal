'use server'

import { revalidatePath } from 'next/cache'
import { del } from '@vercel/blob'
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

// Fecha de la última carga de archivos visible para el usuario actual (los
// admin ven todo). Devuelve null si todavía no hay materiales cargados.
export async function getLastAssetUpload(): Promise<Date | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const filters = []
  if (user.role !== 'admin') {
    filters.push(arrayContains(assets.visibility, [user.role]))
  }

  const [row] = await db
    .select({ createdAt: assets.createdAt })
    .from(assets)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(assets.createdAt))
    .limit(1)

  return row?.createdAt ?? null
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

// Datos del archivo ya subido a Vercel Blob desde el navegador.
export type NewAssetInput = {
  title: string
  description?: string
  category: string
  fileType: string
  tags: string[]
  visibility: Role[]
  fileName: string
  filePathname: string
  fileUrl: string
  fileSize: number
}

// Guarda el registro del asset en la base de datos tras subir el archivo al
// Blob. Solo admin. El archivo ya fue subido por el helper uploadAssetFile
// (server-side para ≤4 MB, o por partes vía /api/assets/chunk para archivos grandes).
export async function saveAssetRecord(input: NewAssetInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()

    const title = input.title.trim()
    const category = input.category.trim()
    const fileType = input.fileType.trim()
    const visibility = input.visibility

    if (!title) return { ok: false, error: 'El título es obligatorio.' }
    if (!category) return { ok: false, error: 'Seleccioná una categoría.' }
    if (!fileType) return { ok: false, error: 'Seleccioná el tipo de archivo.' }
    if (visibility.length === 0)
      return { ok: false, error: 'Seleccioná al menos un rol con visibilidad.' }
    if (!input.fileUrl || !input.filePathname)
      return { ok: false, error: 'Falta la información del archivo subido.' }

    await db.insert(assets).values({
      title,
      description: input.description?.trim() || null,
      category,
      fileType,
      fileName: input.fileName,
      filePathname: input.filePathname,
      fileUrl: input.fileUrl,
      fileSize: input.fileSize,
      tags: input.tags,
      visibility,
      uploadedBy: admin.id,
    })

    revalidatePath('/admin')
    revalidatePath('/')
    return { ok: true }
  } catch (err) {
    console.error('[v0] saveAssetRecord error:', err)
    return { ok: false, error: 'No se pudo registrar el material. Intentá de nuevo.' }
  }
}

// Datos de edición de un asset. Los campos de archivo son opcionales: solo
// vienen cuando el admin resubió un archivo nuevo (ya cargado al Blob).
export type UpdateAssetInput = {
  id: number
  title: string
  description?: string
  category: string
  fileType: string
  tags: string[]
  visibility: Role[]
  // Presentes solo si se reemplazó el archivo.
  fileName?: string
  filePathname?: string
  fileUrl?: string
  fileSize?: number
}

// Actualiza los metadatos de un asset y, opcionalmente, reemplaza el archivo.
// Si llega un archivo nuevo, se borra el anterior del Blob. Solo admin.
export async function updateAsset(input: UpdateAssetInput): Promise<ActionResult> {
  try {
    await requireAdmin()

    const title = input.title.trim()
    const category = input.category.trim()
    const fileType = input.fileType.trim()
    const visibility = input.visibility

    if (!title) return { ok: false, error: 'El título es obligatorio.' }
    if (!category) return { ok: false, error: 'Seleccioná una categoría.' }
    if (!fileType) return { ok: false, error: 'Seleccioná el tipo de archivo.' }
    if (visibility.length === 0)
      return { ok: false, error: 'Seleccioná al menos un rol con visibilidad.' }

    const [row] = await db.select().from(assets).where(eq(assets.id, input.id))
    if (!row) return { ok: false, error: 'El material ya no existe.' }

    // ¿Se resubió un archivo? Se detecta por la presencia del pathname nuevo.
    const hasNewFile = Boolean(input.filePathname && input.fileUrl)

    const values: Partial<typeof assets.$inferInsert> = {
      title,
      description: input.description?.trim() || null,
      category,
      fileType,
      tags: input.tags,
      visibility,
      updatedAt: new Date(),
    }

    if (hasNewFile) {
      values.fileName = input.fileName
      values.filePathname = input.filePathname
      values.fileUrl = input.fileUrl
      values.fileSize = input.fileSize
    }

    await db.update(assets).set(values).where(eq(assets.id, input.id))

    // Borrar el archivo anterior del Blob recién ahora que la BD ya apunta al
    // nuevo. Se usa filePathname (del() lo acepta) porque para las subidas
    // server-side fileUrl es una URL de servicio, no la URL real del blob.
    if (hasNewFile && row.filePathname && row.filePathname !== input.filePathname) {
      try {
        await del(row.filePathname)
      } catch (e) {
        console.error('[v0] blob del (update) error:', e)
      }
    }

    revalidatePath('/admin')
    revalidatePath('/')
    return { ok: true }
  } catch (err) {
    console.error('[v0] updateAsset error:', err)
    return { ok: false, error: 'No se pudo actualizar el material. Intentá de nuevo.' }
  }
}

// Eliminar un asset y su archivo en Blob. Solo admin.
export async function deleteAsset(id: number): Promise<ActionResult> {
  try {
    await requireAdmin()
    const [row] = await db.select().from(assets).where(eq(assets.id, id))
    if (!row) return { ok: false, error: 'El material ya no existe.' }

    if (row.filePathname) {
      try {
        await del(row.filePathname)
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
