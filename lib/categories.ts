import type { Role } from '@/lib/db/schema'

// Categorías del portal: la clave (slug) se guarda en la BD,
// el label y la ruta se usan en la UI. Coinciden con la navegación.
export type CategoryKey =
  | 'identidad'
  | 'productos'
  | 'recursos'
  | 'redes'
  | 'imagenes'
  | 'videos'
  | 'campanas'

export type CategoryMeta = {
  key: CategoryKey
  label: string
  href: string
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'identidad', label: 'Identidad de Marca', href: '/identidad' },
  { key: 'productos', label: 'Productos', href: '/productos' },
  { key: 'recursos', label: 'Recursos Comerciales', href: '/recursos' },
  { key: 'redes', label: 'Redes Sociales', href: '/redes' },
  { key: 'imagenes', label: 'Banco de Imágenes', href: '/imagenes' },
  { key: 'videos', label: 'Videos', href: '/videos' },
  { key: 'campanas', label: 'Campañas', href: '/campanas' },
]

export const CATEGORY_LABELS: Record<CategoryKey, string> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.key] = c.label
    return acc
  },
  {} as Record<CategoryKey, string>,
)

// Tipos de archivo soportados al cargar un asset.
export const FILE_TYPES = [
  'PDF',
  'PNG',
  'SVG',
  'JPG',
  'ZIP',
  'PPTX',
  'MP4',
  'DOCX',
] as const

export type FileTypeOption = (typeof FILE_TYPES)[number]

// Roles que pueden recibir visibilidad (todos menos que se restrinja).
export const VISIBILITY_ROLES: Role[] = ['admin', 'distribuidor', 'comercial']
