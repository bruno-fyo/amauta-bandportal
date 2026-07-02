import type { Role } from '@/lib/db/schema'

// Categorías del portal: la clave (slug) se guarda en la BD,
// el label y la ruta se usan en la UI. Coinciden con la navegación.
export type CategoryKey =
  | 'identidad'
  | 'productos'
  | 'recursos'
  | 'kit-distribuidor'
  | 'redes'
  | 'campanas'

export type CategoryMeta = {
  key: CategoryKey
  label: string
  href: string
  // Roles que pueden ver la categoría. undefined = visible para todos.
  // El administrador siempre tiene acceso a todas las categorías.
  roles?: Role[]
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'identidad', label: 'Identidad de Marca', href: '/identidad' },
  { key: 'productos', label: 'Productos', href: '/productos' },
  // Recursos Comerciales: solo colaboradores (rol "comercial").
  { key: 'recursos', label: 'Recursos Comerciales', href: '/recursos', roles: ['comercial'] },
  // Kit del Distribuidor: solo distribuidores.
  { key: 'kit-distribuidor', label: 'Kit del Distribuidor', href: '/kit-distribuidor', roles: ['distribuidor'] },
  { key: 'redes', label: 'Redes Sociales', href: '/redes' },
  { key: 'campanas', label: 'Campañas', href: '/campanas' },
]

// ¿El rol puede acceder a la categoría? El admin siempre puede.
export function canAccessCategory(role: Role, key: CategoryKey): boolean {
  if (role === 'admin') return true
  const cat = CATEGORIES.find((c) => c.key === key)
  if (!cat?.roles) return true
  return cat.roles.includes(role)
}

// Categorías visibles para un rol dado.
export function categoriesForRole(role: Role): CategoryMeta[] {
  return CATEGORIES.filter((c) => canAccessCategory(role, c.key))
}

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
