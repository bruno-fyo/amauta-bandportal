import { pgTable, text, timestamp, boolean, serial, integer, primaryKey } from 'drizzle-orm/pg-core'

// ---------------------------------------------------------------------------
// Better Auth tables. Column names are camelCase to match Better Auth defaults.
// Do not rename these columns.
// ---------------------------------------------------------------------------
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  // Rol de la aplicación: 'admin' | 'distribuidor' | 'comercial'
  role: text('role').notNull().default('comercial'),
  // Copia visible de la contraseña (solo para que el admin pueda consultarla).
  // Se completa al crear/actualizar la contraseña desde el panel. Los usuarios
  // creados antes de esta función no la tienen (se muestra "—").
  plainPassword: text('plainPassword'),
  createdAt: timestamp('createdAt')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updatedAt')
    .$defaultFn(() => new Date())
    .notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').$defaultFn(() => new Date()),
  updatedAt: timestamp('updatedAt').$defaultFn(() => new Date()),
})

// ---------------------------------------------------------------------------
// Tabla de aplicación: assets del brand portal.
// ---------------------------------------------------------------------------
export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  // Categoría del portal: identidad, productos, recursos, imagenes, videos, redes, campanas
  category: text('category').notNull(),
  // Tipo de archivo: pdf, png, svg, zip, jpg, mp4, ...
  fileType: text('fileType').notNull(),
  // Datos del archivo en Vercel Blob (privado)
  fileName: text('fileName'),
  filePathname: text('filePathname'),
  fileUrl: text('fileUrl'),
  fileSize: integer('fileSize'),
  // Tags y visibilidad por rol como arrays de Postgres
  tags: text('tags').array().notNull().default([]),
  visibility: text('visibility').array().notNull().default([]),
  // Usuario que subió el asset
  uploadedBy: text('uploadedBy').notNull(),
  createdAt: timestamp('createdAt')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updatedAt')
    .$defaultFn(() => new Date())
    .notNull(),
})

export type Asset = typeof assets.$inferSelect

// ---------------------------------------------------------------------------
// Fichas técnicas de productos. Hay una ficha (PDF) por producto y por país
// (Argentina / Uruguay), identificada por (slug, country). Autogestionable
// por el admin: se puede subir, reemplazar o eliminar sin tocar el código.
// ---------------------------------------------------------------------------
export const productFichas = pgTable(
  'product_fichas',
  {
    // Slug del producto (coincide con products.slug).
    slug: text('slug').notNull(),
    // País de la ficha: 'ar' (Argentina) | 'uy' (Uruguay).
    country: text('country').notNull().default('ar'),
    // Datos del PDF en Vercel Blob (privado).
    fileName: text('fileName'),
    filePathname: text('filePathname').notNull(),
    fileUrl: text('fileUrl').notNull(),
    fileSize: integer('fileSize'),
    // Usuario admin que subió/actualizó la ficha.
    uploadedBy: text('uploadedBy').notNull(),
    createdAt: timestamp('createdAt')
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp('updatedAt')
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.slug, table.country] }),
  }),
)

export type ProductFicha = typeof productFichas.$inferSelect
export type FichaCountry = 'ar' | 'uy'
export const FICHA_COUNTRIES: FichaCountry[] = ['ar', 'uy']
export const FICHA_COUNTRY_LABELS: Record<FichaCountry, string> = {
  ar: 'Argentina',
  uy: 'Uruguay',
}

// ---------------------------------------------------------------------------
// Imágenes descargables del producto (galería). Varias por producto.
// ---------------------------------------------------------------------------
export const productImages = pgTable('product_images', {
  id: serial('id').primaryKey(),
  // Slug del producto (coincide con products.slug).
  slug: text('slug').notNull(),
  // Datos de la imagen en Vercel Blob (público, descargable).
  fileName: text('fileName'),
  filePathname: text('filePathname').notNull(),
  fileUrl: text('fileUrl').notNull(),
  fileSize: integer('fileSize'),
  uploadedBy: text('uploadedBy').notNull(),
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: timestamp('createdAt')
    .$defaultFn(() => new Date())
    .notNull(),
})

export type ProductImage = typeof productImages.$inferSelect

// ---------------------------------------------------------------------------
// Catálogo administrable: familias y productos. El administrador puede crear,
// editar y eliminar familias y productos desde /admin. Cada producto puede
// tener una imagen mock-up (Blob público) y una ficha técnica (product_fichas).
// ---------------------------------------------------------------------------
export const productFamilies = pgTable('product_families', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  // Tipo / categoría, ej. "Microgranulados".
  type: text('type'),
  description: text('description'),
  // Color principal de la familia (acento visual).
  color: text('color').notNull(),
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: timestamp('createdAt')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updatedAt')
    .$defaultFn(() => new Date())
    .notNull(),
})

export type ProductFamilyRow = typeof productFamilies.$inferSelect

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  // Familia a la que pertenece (productFamilies.id). Sin FK para iterar fácil.
  familyId: text('familyId').notNull(),
  // Slug estable y único: enlaza imagen y ficha técnica del producto.
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  // URL de la imagen mock-up: puede ser un archivo local (/products/x.png)
  // para los productos migrados, o una URL de Blob público para los nuevos.
  imageUrl: text('imageUrl'),
  // Pathname en Blob (solo si la imagen se subió a Blob), para poder borrarla.
  imagePathname: text('imagePathname'),
  // Logo del producto (Blob público, descargable). Opcional.
  logoUrl: text('logoUrl'),
  logoPathname: text('logoPathname'),
  isNew: boolean('isNew').notNull().default(false),
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: timestamp('createdAt')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updatedAt')
    .$defaultFn(() => new Date())
    .notNull(),
})

export type ProductRow = typeof products.$inferSelect

export type Role = 'admin' | 'distribuidor' | 'comercial'
export const ROLES: Role[] = ['admin', 'distribuidor', 'comercial']
export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  distribuidor: 'Distribuidor',
  comercial: 'Colaborador',
}
