'use server'

import { revalidatePath } from 'next/cache'
import { del } from '@vercel/blob'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { productFichas, type ProductFicha } from '@/lib/db/schema'
import { getCurrentUser, requireAdmin } from '@/lib/session'

export type ActionResult = { ok: true } | { ok: false; error: string }

// Devuelve todas las fichas cargadas como un mapa slug -> ficha.
// Cualquier usuario con sesión puede leerlas (son info pública del portal).
export async function getFichasMap(): Promise<Record<string, ProductFicha>> {
  const user = await getCurrentUser()
  if (!user) return {}

  const rows = await db.select().from(productFichas)
  return rows.reduce<Record<string, ProductFicha>>((acc, f) => {
    acc[f.slug] = f
    return acc
  }, {})
}

// Datos del PDF ya subido a Vercel Blob desde el navegador.
export type NewFichaInput = {
  slug: string
  fileName: string
  filePathname: string
  fileUrl: string
  fileSize: number
}

// Crea o reemplaza (upsert) la ficha técnica de un producto. Solo admin.
// Si ya existía una ficha para ese slug, borra el PDF anterior del Blob.
export async function saveFichaRecord(input: NewFichaInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()

    const slug = input.slug.trim()
    if (!slug) return { ok: false, error: 'Falta el producto.' }
    if (!input.fileUrl || !input.filePathname)
      return { ok: false, error: 'Falta la información del archivo subido.' }

    // Si ya hay una ficha para este producto, eliminamos el PDF anterior.
    const [existing] = await db
      .select()
      .from(productFichas)
      .where(eq(productFichas.slug, slug))

    if (existing?.fileUrl && existing.fileUrl !== input.fileUrl) {
      try {
        await del(existing.fileUrl)
      } catch (e) {
        console.error('[v0] blob del (reemplazo ficha) error:', e)
      }
    }

    await db
      .insert(productFichas)
      .values({
        slug,
        fileName: input.fileName,
        filePathname: input.filePathname,
        fileUrl: input.fileUrl,
        fileSize: input.fileSize,
        uploadedBy: admin.id,
      })
      .onConflictDoUpdate({
        target: productFichas.slug,
        set: {
          fileName: input.fileName,
          filePathname: input.filePathname,
          fileUrl: input.fileUrl,
          fileSize: input.fileSize,
          uploadedBy: admin.id,
          updatedAt: new Date(),
        },
      })

    revalidatePath('/admin')
    revalidatePath('/productos')
    return { ok: true }
  } catch (err) {
    console.error('[v0] saveFichaRecord error:', err)
    return { ok: false, error: 'No se pudo registrar la ficha. Intentá de nuevo.' }
  }
}

// Elimina la ficha técnica de un producto y su PDF en Blob. Solo admin.
export async function deleteFicha(slug: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    const [row] = await db
      .select()
      .from(productFichas)
      .where(eq(productFichas.slug, slug))
    if (!row) return { ok: false, error: 'La ficha ya no existe.' }

    if (row.fileUrl) {
      try {
        await del(row.fileUrl)
      } catch (e) {
        console.error('[v0] blob del error:', e)
      }
    }

    await db.delete(productFichas).where(eq(productFichas.slug, slug))
    revalidatePath('/admin')
    revalidatePath('/productos')
    return { ok: true }
  } catch (err) {
    console.error('[v0] deleteFicha error:', err)
    return { ok: false, error: 'No se pudo eliminar la ficha.' }
  }
}
