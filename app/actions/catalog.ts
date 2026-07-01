'use server'

import { revalidatePath } from 'next/cache'
import { del } from '@vercel/blob'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { productFamilies, products, productFichas } from '@/lib/db/schema'
import { requireAdmin, getCurrentUser } from '@/lib/session'

export type ActionResult = { ok: true } | { ok: false; error: string }

export type CatalogProduct = {
  id: string
  slug: string
  name: string
  color: string
  imageUrl: string | null
  isNew: boolean
  hasFicha: boolean
}

export type CatalogFamily = {
  id: string
  name: string
  type: string | null
  description: string | null
  color: string
  products: CatalogProduct[]
}

// Paleta por defecto para asignar color automáticamente a lo nuevo.
const DEFAULT_PALETTE = [
  '#6CC24A',
  '#E35205',
  '#0072C6',
  '#00A651',
  '#6D4C88',
  '#B08B60',
  '#F2A900',
  '#00AEC7',
]

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeColor(color: string | undefined, fallback: string): string {
  const c = (color ?? '').trim()
  return /^#[0-9a-fA-F]{6}$/.test(c) ? c : fallback
}

// ---------------------------------------------------------------------------
// Lectura pública (cualquier usuario con sesión) del catálogo completo.
// ---------------------------------------------------------------------------
export async function getCatalog(): Promise<CatalogFamily[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const [families, prods, fichas] = await Promise.all([
    db.select().from(productFamilies).orderBy(asc(productFamilies.sortOrder), asc(productFamilies.name)),
    db.select().from(products).orderBy(asc(products.sortOrder), asc(products.name)),
    db.select({ slug: productFichas.slug }).from(productFichas),
  ])

  const fichaSet = new Set(fichas.map((f) => f.slug))

  return families.map((fam) => ({
    id: fam.id,
    name: fam.name,
    type: fam.type,
    description: fam.description,
    color: fam.color,
    products: prods
      .filter((p) => p.familyId === fam.id)
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        color: p.color,
        imageUrl: p.imageUrl,
        isNew: p.isNew,
        hasFicha: fichaSet.has(p.slug),
      })),
  }))
}

// ---------------------------------------------------------------------------
// Familias
// ---------------------------------------------------------------------------
export type FamilyInput = {
  name: string
  type?: string
  description?: string
  color?: string
}

async function uniqueFamilyId(base: string): Promise<string> {
  const root = slugify(base) || 'familia'
  let candidate = root
  let n = 2
  // Reintenta hasta encontrar un id libre.
  while (true) {
    const [row] = await db
      .select({ id: productFamilies.id })
      .from(productFamilies)
      .where(eq(productFamilies.id, candidate))
    if (!row) return candidate
    candidate = `${root}-${n++}`
  }
}

export async function createFamily(input: FamilyInput): Promise<ActionResult> {
  try {
    await requireAdmin()
    const name = input.name.trim()
    if (!name) return { ok: false, error: 'El nombre de la familia es obligatorio.' }

    const id = await uniqueFamilyId(name)
    const count = await db.select({ id: productFamilies.id }).from(productFamilies)
    const color = normalizeColor(
      input.color,
      DEFAULT_PALETTE[count.length % DEFAULT_PALETTE.length],
    )

    await db.insert(productFamilies).values({
      id,
      name,
      type: input.type?.trim() || null,
      description: input.description?.trim() || null,
      color,
      sortOrder: count.length,
    })

    revalidatePath('/admin')
    revalidatePath('/productos')
    return { ok: true }
  } catch (err) {
    console.error('[v0] createFamily error:', err)
    return { ok: false, error: 'No se pudo crear la familia.' }
  }
}

export async function updateFamily(id: string, input: FamilyInput): Promise<ActionResult> {
  try {
    await requireAdmin()
    const name = input.name.trim()
    if (!name) return { ok: false, error: 'El nombre de la familia es obligatorio.' }

    const [existing] = await db
      .select()
      .from(productFamilies)
      .where(eq(productFamilies.id, id))
    if (!existing) return { ok: false, error: 'La familia no existe.' }

    await db
      .update(productFamilies)
      .set({
        name,
        type: input.type?.trim() || null,
        description: input.description?.trim() || null,
        color: normalizeColor(input.color, existing.color),
        updatedAt: new Date(),
      })
      .where(eq(productFamilies.id, id))

    revalidatePath('/admin')
    revalidatePath('/productos')
    return { ok: true }
  } catch (err) {
    console.error('[v0] updateFamily error:', err)
    return { ok: false, error: 'No se pudo actualizar la familia.' }
  }
}

export async function deleteFamily(id: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    const familyProducts = await db
      .select()
      .from(products)
      .where(eq(products.familyId, id))

    // Limpia imágenes y fichas de cada producto de la familia.
    for (const p of familyProducts) {
      await cleanupProductAssets(p.slug, p.imagePathname)
    }
    await db.delete(products).where(eq(products.familyId, id))
    await db.delete(productFamilies).where(eq(productFamilies.id, id))

    revalidatePath('/admin')
    revalidatePath('/productos')
    return { ok: true }
  } catch (err) {
    console.error('[v0] deleteFamily error:', err)
    return { ok: false, error: 'No se pudo eliminar la familia.' }
  }
}

// ---------------------------------------------------------------------------
// Productos
// ---------------------------------------------------------------------------
export type ProductInput = {
  familyId: string
  name: string
  color?: string
  isNew?: boolean
  imageUrl?: string | null
  imagePathname?: string | null
}

async function uniqueProductSlug(base: string): Promise<string> {
  const root = slugify(base) || 'producto'
  let candidate = root
  let n = 2
  while (true) {
    const [row] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, candidate))
    if (!row) return candidate
    candidate = `${root}-${n++}`
  }
}

// Borra del Blob la imagen (si es un archivo subido) y la ficha del producto.
async function cleanupProductAssets(slug: string, imagePathname: string | null) {
  if (imagePathname) {
    try {
      await del(imagePathname)
    } catch (e) {
      console.error('[v0] blob del (imagen producto) error:', e)
    }
  }
  const [ficha] = await db
    .select()
    .from(productFichas)
    .where(eq(productFichas.slug, slug))
  if (ficha?.fileUrl) {
    try {
      await del(ficha.fileUrl)
    } catch (e) {
      console.error('[v0] blob del (ficha producto) error:', e)
    }
    await db.delete(productFichas).where(eq(productFichas.slug, slug))
  }
}

export type CreateProductResult =
  | { ok: true; slug: string }
  | { ok: false; error: string }

export async function createProduct(
  input: ProductInput,
): Promise<CreateProductResult> {
  try {
    await requireAdmin()
    const name = input.name.trim()
    if (!name) return { ok: false, error: 'El nombre del producto es obligatorio.' }
    if (!input.familyId) return { ok: false, error: 'Elegí una familia.' }

    const [family] = await db
      .select()
      .from(productFamilies)
      .where(eq(productFamilies.id, input.familyId))
    if (!family) return { ok: false, error: 'La familia elegida no existe.' }

    const slug = await uniqueProductSlug(name)
    const siblings = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.familyId, input.familyId))

    await db.insert(products).values({
      id: slug,
      familyId: input.familyId,
      slug,
      name,
      color: normalizeColor(input.color, family.color),
      imageUrl: input.imageUrl ?? null,
      imagePathname: input.imagePathname ?? null,
      isNew: !!input.isNew,
      sortOrder: siblings.length,
    })

    revalidatePath('/admin')
    revalidatePath('/productos')
    return { ok: true, slug }
  } catch (err) {
    console.error('[v0] createProduct error:', err)
    return { ok: false, error: 'No se pudo crear el producto.' }
  }
}

export type ProductUpdateInput = {
  familyId: string
  name: string
  color?: string
  isNew?: boolean
  // Imagen: si se envía una nueva, reemplaza la anterior.
  imageUrl?: string | null
  imagePathname?: string | null
  imageChanged?: boolean
}

export async function updateProduct(
  id: string,
  input: ProductUpdateInput,
): Promise<ActionResult> {
  try {
    await requireAdmin()
    const name = input.name.trim()
    if (!name) return { ok: false, error: 'El nombre del producto es obligatorio.' }

    const [existing] = await db.select().from(products).where(eq(products.id, id))
    if (!existing) return { ok: false, error: 'El producto no existe.' }

    // Si cambió la imagen y la anterior era un archivo en Blob, la borramos.
    if (input.imageChanged && existing.imagePathname) {
      try {
        await del(existing.imagePathname)
      } catch (e) {
        console.error('[v0] blob del (reemplazo imagen) error:', e)
      }
    }

    await db
      .update(products)
      .set({
        familyId: input.familyId || existing.familyId,
        name,
        color: normalizeColor(input.color, existing.color),
        isNew: !!input.isNew,
        imageUrl: input.imageChanged ? input.imageUrl ?? null : existing.imageUrl,
        imagePathname: input.imageChanged
          ? input.imagePathname ?? null
          : existing.imagePathname,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))

    revalidatePath('/admin')
    revalidatePath('/productos')
    return { ok: true }
  } catch (err) {
    console.error('[v0] updateProduct error:', err)
    return { ok: false, error: 'No se pudo actualizar el producto.' }
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    const [row] = await db.select().from(products).where(eq(products.id, id))
    if (!row) return { ok: false, error: 'El producto ya no existe.' }

    await cleanupProductAssets(row.slug, row.imagePathname)
    await db.delete(products).where(eq(products.id, id))

    revalidatePath('/admin')
    revalidatePath('/productos')
    return { ok: true }
  } catch (err) {
    console.error('[v0] deleteProduct error:', err)
    return { ok: false, error: 'No se pudo eliminar el producto.' }
  }
}
