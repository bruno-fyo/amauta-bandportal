import { pgTable, text, timestamp, boolean, serial, integer } from 'drizzle-orm/pg-core'

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
export type Role = 'admin' | 'distribuidor' | 'comercial'
export const ROLES: Role[] = ['admin', 'distribuidor', 'comercial']
export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  distribuidor: 'Distribuidor',
  comercial: 'Comercial',
}
