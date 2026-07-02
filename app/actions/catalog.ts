'use server'

import { revalidatePath } from 'next/cache'
import { del } from '@vercel/blob'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  productFamilies,
  products,
  productFichas,
  productImages,
} from '@/lib/db/schema'
import { requireAdmin, getCurrentUser } from '@/lib/session'

export type ActionResult = { ok: true } | { ok: false; error: string }

export type CatalogProductImage = {
  id: number
  fileName: string | null
  fileUrl: string
  fileSize: number | null
}

export type CatalogProduct = {
  id: string
  slug: string
  name: string
  color: string
  imageUrl: string | null
  logoUrl: string | null
  isNew: boolean
  images: CatalogProductImage[]
  hasFichaAr: boolean
  hasFichaUy: boolean
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

  const [families, prods, fichas, images] = await Promise.all([
    db.select().from(productFamilies).orderBy(asc(productFamilies.sortOrder), asc(productFamilies.name)),
    db.select().from(products).orderBy(asc(products.sortOrder), asc(products.name)),
    db.select({ slug: productFichas.slug, country: productFichas.country }).from(productFichas),
    db.select().from(productImages).orderBy(asc(productImages.sortOrder), asc(productImages.id)),
  ])

  const fichaArSet = new Set(fichas.filter((f) => f.country === 'ar').map((f) => f.slug))
  const fichaUySet = new Set(fichas.filter((f) => f.country === 'uy').map((f) => f.slug))

  const imagesBySlug = images.reduce<Record<string, CatalogProductImage[]>>((acc, img) => {
    acc[img.slug] = acc[img.slug] ?? []
    acc[img.slug].push({
      id: img.id,
      fileName: img.fileName,
      fileUrl: img.fileUrl,
      fileSize: img.fileSize,
    })
    return acc
  }, {})

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
        logoUrl: p.logoUrl,
        isNew: p.isNew,
        images: imagesBySlug[p.slug] ?? [],
        hasFichaAr: fichaArSet.has(p.slug),
        hasFichaUy: fichaUySet.has(p.slug),
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

    // Limpia imágenes, logo y fichas de cada producto de la familia.
    for (const p of familyProducts) {
      await cleanupProductAssets(p.slug, p.imagePathname, p.logoPathname)
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

// Borra del Blob la imagen mock-up, el logo, las imágenes de la galería y todas
// las fichas (AR/UY) de un producto, junto con sus registros.
async function cleanupProductAssets(
  slug: string,
  imagePathname: string | null,
  logoPathname?: string | null,
) {
  const toDelete = [imagePathname, logoPathname].filter(Boolean) as string[]
  for (const pathname of toDelete) {
    try {
      await del(pathname)
    } catch (e) {
      console.error('[v0] blob del (imagen/logo producto) error:', e)
    }
  }

  // Fichas técnicas (todas las que existan para el producto).
  const fichas = await db
    .select()
    .from(productFichas)
    .where(eq(productFichas.slug, slug))
  for (const ficha of fichas) {
    if (ficha.filePathname) {
      try {
        await del(ficha.filePathname)
      } catch (e) {
        console.error('[v0] blob del (ficha producto) error:', e)
      }
    }
  }
  if (fichas.length > 0) {
    await db.delete(productFichas).where(eq(productFichas.slug, slug))
  }

  // Imágenes descargables de la galería.
  const imgs = await db
    .select()
    .from(productImages)
    .where(eq(productImages.slug, slug))
  for (const img of imgs) {
    if (img.filePathname) {
      try {
        await del(img.filePathname)
      } catch (e) {
        console.error('[v0] blob del (imagen galería) error:', e)
      }
    }
  }
  if (imgs.length > 0) {
    await db.delete(productImages).where(eq(productImages.slug, slug))
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

    await cleanupProductAssets(row.slug, row.imagePathname, row.logoPathname)
    await db.delete(products).where(eq(products.id, id))

    revalidatePath('/admin')
    revalidatePath('/productos')
    return { ok: true }
  } catch (err) {
    console.error('[v0] deleteProduct error:', err)
    return { ok: false, error: 'No se pudo eliminar el producto.' }
  }
}

// ---------------------------------------------------------------------------
// Logo del producto (Blob público, descargable)
// ---------------------------------------------------------------------------
export type LogoInput = {
  productId: string
  fileUrl: string
  filePathname: string
}

// Guarda/reemplaza el logo del producto. Borra el logo anterior del Blob.
export async function saveProductLogo(input: LogoInput): Promise<ActionResult> {
  try {
    await requireAdmin()
    if (!input.fileUrl || !input.filePathname)
      return { ok: false, error: 'Falta la información del logo subido.' }

    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, input.productId))
    if (!existing) return { ok: false, error: 'El producto no existe.' }

    if (existing.logoPathname && existing.logoPathname !== input.filePathname) {
      try {
        await del(existing.logoPathname)
      } catch (e) {
        console.error('[v0] blob del (reemplazo logo) error:', e)
      }
    }

    await db
      .update(products)
      .set({ logoUrl: input.fileUrl, logoPathname: input.filePathname, updatedAt: new Date() })
      .where(eq(products.id, input.productId))

    revalidatePath('/admin')
    revalidatePath('/productos')
    return { ok: true }
  } catch (err) {
    console.error('[v0] saveProductLogo error:', err)
    return { ok: false, error: 'No se pudo guardar el logo.' }
  }
}

export async function deleteProductLogo(productId: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    const [existing] = await db.select().from(products).where(eq(products.id, productId))
    if (!existing) return { ok: false, error: 'El producto no existe.' }

    if (existing.logoPathname) {
      try {
        await del(existing.logoPathname)
      } catch (e) {
        console.error('[v0] blob del (logo) error:', e)
      }
    }

    await db
      .update(products)
      .set({ logoUrl: null, logoPathname: null, updatedAt: new Date() })
      .where(eq(products.id, productId))

    revalidatePath('/admin')
    revalidatePath('/productos')
    return { ok: true }
  } catch (err) {
    console.error('[v0] deleteProductLogo error:', err)
    return { ok: false, error: 'No se pudo eliminar el logo.' }
  }
}

// ---------------------------------------------------------------------------
// Imágenes descargables del producto (galería)
// ---------------------------------------------------------------------------
export type ProductImageInput = {
  slug: string
  fileName: string
  filePathname: string
  fileUrl: string
  fileSize: number
}

export async function addProductImage(input: ProductImageInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    const slug = input.slug.trim()
    if (!slug) return { ok: false, error: 'Falta el producto.' }
    if (!input.fileUrl || !input.filePathname)
      return { ok: false, error: 'Falta la información de la imagen subida.' }

    const siblings = await db
      .select({ id: productImages.id })
      .from(productImages)
      .where(eq(productImages.slug, slug))

    await db.insert(productImages).values({
      slug,
      fileName: input.fileName,
      filePathname: input.filePathname,
      fileUrl: input.fileUrl,
      fileSize: input.fileSize,
      uploadedBy: admin.id,
      sortOrder: siblings.length,
    })

    revalidatePath('/admin')
    revalidatePath('/productos')
    return { ok: true }
  } catch (err) {
    console.error('[v0] addProductImage error:', err)
    return { ok: false, error: 'No se pudo agregar la imagen.' }
  }
}

export async function deleteProductImage(id: number): Promise<ActionResult> {
  try {
    await requireAdmin()
    const [row] = await db.select().from(productImages).where(eq(productImages.id, id))
    if (!row) return { ok: false, error: 'La imagen ya no existe.' }

    if (row.filePathname) {
      try {
        await del(row.filePathname)
      } catch (e) {
        console.error('[v0] blob del (imagen galería) error:', e)
      }
    }

    await db.delete(productImages).where(eq(productImages.id, id))
    revalidatePath('/admin')
    revalidatePath('/productos')
    return { ok: true }
  } catch (err) {
    console.error('[v0] deleteProductImage error:', err)
    return { ok: false, error: 'No se pudo eliminar la imagen.' }
  }
}
