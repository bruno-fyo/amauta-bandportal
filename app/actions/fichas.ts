'use server'

import { revalidatePath } from 'next/cache'
import { del } from '@vercel/blob'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  productFichas,
  type ProductFicha,
  type FichaCountry,
  FICHA_COUNTRIES,
} from '@/lib/db/schema'
import { getCurrentUser, requireAdmin } from '@/lib/session'

export type ActionResult = { ok: true } | { ok: false; error: string }

// Fichas de un producto agrupadas por país.
export type FichasByCountry = Partial<Record<FichaCountry, ProductFicha>>

function isCountry(value: string): value is FichaCountry {
  return (FICHA_COUNTRIES as string[]).includes(value)
}

// Devuelve todas las fichas cargadas como un mapa slug -> { ar?, uy? }.
// Cualquier usuario con sesión puede leerlas (son info del portal).
export async function getFichasMap(): Promise<Record<string, FichasByCountry>> {
  const user = await getCurrentUser()
  if (!user) return {}

  const rows = await db.select().from(productFichas)
  return rows.reduce<Record<string, FichasByCountry>>((acc, f) => {
    const country = isCountry(f.country) ? f.country : 'ar'
    acc[f.slug] = acc[f.slug] ?? {}
    acc[f.slug][country] = f
    return acc
  }, {})
}

// Datos del PDF ya subido a Vercel Blob desde el navegador.
export type NewFichaInput = {
  slug: string
  country: FichaCountry
  fileName: string
  filePathname: string
  fileUrl: string
  fileSize: number
}

// Crea o reemplaza (upsert) la ficha técnica de un producto para un país.
// Solo admin. Si ya existía una ficha para ese (slug, país), borra el PDF
// anterior del Blob.
export async function saveFichaRecord(input: NewFichaInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()

    const slug = input.slug.trim()
    if (!slug) return { ok: false, error: 'Falta el producto.' }
    if (!isCountry(input.country)) return { ok: false, error: 'País inválido.' }
    if (!input.fileUrl || !input.filePathname)
      return { ok: false, error: 'Falta la información del archivo subido.' }

    // Si ya hay una ficha para este producto y país, eliminamos el PDF anterior.
    const [existing] = await db
      .select()
      .from(productFichas)
      .where(and(eq(productFichas.slug, slug), eq(productFichas.country, input.country)))

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
        country: input.country,
        fileName: input.fileName,
        filePathname: input.filePathname,
        fileUrl: input.fileUrl,
        fileSize: input.fileSize,
        uploadedBy: admin.id,
      })
      .onConflictDoUpdate({
        target: [productFichas.slug, productFichas.country],
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

// Elimina la ficha técnica de un producto para un país y su PDF en Blob.
// Solo admin.
export async function deleteFicha(
  slug: string,
  country: FichaCountry,
): Promise<ActionResult> {
  try {
    await requireAdmin()
    if (!isCountry(country)) return { ok: false, error: 'País inválido.' }

    const [row] = await db
      .select()
      .from(productFichas)
      .where(and(eq(productFichas.slug, slug), eq(productFichas.country, country)))
    if (!row) return { ok: false, error: 'La ficha ya no existe.' }

    if (row.fileUrl) {
      try {
        await del(row.fileUrl)
      } catch (e) {
        console.error('[v0] blob del error:', e)
      }
    }

    await db
      .delete(productFichas)
      .where(and(eq(productFichas.slug, slug), eq(productFichas.country, country)))
    revalidatePath('/admin')
    revalidatePath('/productos')
    return { ok: true }
  } catch (err) {
    console.error('[v0] deleteFicha error:', err)
    return { ok: false, error: 'No se pudo eliminar la ficha.' }
  }
}
