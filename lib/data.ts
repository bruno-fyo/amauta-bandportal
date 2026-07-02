import {
  LayoutDashboard,
  Fingerprint,
  Package,
  Briefcase,
  PackageOpen,
  Share2,
  Megaphone,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/lib/db/schema'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  // Roles que ven el ítem. undefined = todos. El admin siempre lo ve.
  roles?: Role[]
}

export const navItems: NavItem[] = [
  { label: 'Inicio', href: '/', icon: LayoutDashboard },
  { label: 'Identidad de Marca', href: '/identidad', icon: Fingerprint },
  { label: 'Productos', href: '/productos', icon: Package },
  { label: 'Recursos Comerciales', href: '/recursos', icon: Briefcase, roles: ['comercial'] },
  { label: 'Kit del Distribuidor', href: '/kit-distribuidor', icon: PackageOpen, roles: ['distribuidor'] },
  { label: 'Redes Sociales', href: '/redes', icon: Share2 },
  { label: 'Campañas', href: '/campanas', icon: Megaphone },
]

// Ítems de navegación visibles para un rol. El admin ve todo.
export function navItemsForRole(role: Role): NavItem[] {
  return navItems.filter(
    (item) => !item.roles || role === 'admin' || item.roles.includes(role),
  )
}

export type ResourceType =
  | 'PDF'
  | 'SVG'
  | 'PNG'
  | 'ZIP'
  | 'Video'
  | 'PPTX'
  | 'Imagen'

export type Resource = {
  id: string
  title: string
  type: ResourceType
  category: string
  updated: string
  image: string
  size?: string
}

export const featuredResources: Resource[] = [
  {
    id: 'kit-comercial-2025',
    title: 'Kit Comercial Completo 2025',
    type: 'ZIP',
    category: 'Recursos Comerciales',
    updated: '18 jun 2026',
    image: '/images/people-field.png',
    size: '248 MB',
  },
  {
    id: 'manual-marca',
    title: 'Manual de Identidad de Marca',
    type: 'PDF',
    category: 'Identidad de Marca',
    updated: '12 jun 2026',
    image: '/images/soil-hands.png',
    size: '32 MB',
  },
  {
    id: 'catalogo-productos',
    title: 'Catálogo de Productos Nutricionales',
    type: 'PDF',
    category: 'Productos',
    updated: '09 jun 2026',
    image: '/images/product-granulado.png',
    size: '18 MB',
  },
  {
    id: 'campana-trigo',
    title: 'Campaña SabioTrigo — Piezas',
    type: 'ZIP',
    category: 'Campañas',
    updated: '04 jun 2026',
    image: '/images/campaign-trigo.png',
    size: '96 MB',
  },
]

export const recentResources: Resource[] = [
  {
    id: 'placas-redes-junio',
    title: 'Placas Redes Sociales — Junio',
    type: 'ZIP',
    category: 'Redes Sociales',
    updated: '20 jun 2026',
    image: '/images/crop-maiz.png',
    size: '54 MB',
  },
  {
    id: 'ficha-bio-super',
    title: 'Ficha Técnica BIO Súper',
    type: 'PDF',
    category: 'Productos',
    updated: '19 jun 2026',
    image: '/images/product-bio.png',
    size: '4 MB',
  },
  {
    id: 'fotos-cosecha-fina',
    title: 'Banco de Imágenes — Cosecha Fina',
    type: 'Imagen',
    category: 'Banco de Imágenes',
    updated: '17 jun 2026',
    image: '/images/crop-trigo.png',
    size: '320 MB',
  },
  {
    id: 'video-institucional',
    title: 'Video Institucional Amauta',
    type: 'Video',
    category: 'Videos',
    updated: '15 jun 2026',
    image: '/images/field-aerial.png',
    size: '1.2 GB',
  },
  {
    id: 'logos-svg-pack',
    title: 'Pack de Logos SVG',
    type: 'SVG',
    category: 'Identidad de Marca',
    updated: '12 jun 2026',
    image: '/images/soil-hands.png',
    size: '2 MB',
  },
  {
    id: 'presentacion-comercial',
    title: 'Presentación Comercial Q3',
    type: 'PPTX',
    category: 'Recursos Comerciales',
    updated: '10 jun 2026',
    image: '/images/people-field.png',
    size: '46 MB',
  },
]

export type Category = {
  title: string
  href: string
  count: number
  image: string
}

export const categories: Category[] = [
  {
    title: 'Identidad de Marca',
    href: '/identidad',
    count: 24,
    image: '/images/soil-hands.png',
  },
  {
    title: 'Productos',
    href: '/productos',
    count: 58,
    image: '/images/product-granulado.png',
  },
  {
    title: 'Recursos Comerciales',
    href: '/recursos',
    count: 36,
    image: '/images/people-field.png',
  },
  {
    title: 'Redes Sociales',
    href: '/redes',
    count: 142,
    image: '/images/crop-maiz.png',
  },
  {
    title: 'Banco de Imágenes',
    href: '/imagenes',
    count: 320,
    image: '/images/crop-girasol.png',
  },
  {
    title: 'Videos',
    href: '/videos',
    count: 19,
    image: '/images/field-aerial.png',
  },
]

export type Product = {
  id: string
  name: string
  line: string
  description: string
  image: string
  type: ResourceType
}

export const productLines = [
  'Granulados',
  'Foliares',
  'Hidrosolubles',
  'Microgranulados',
  'Orgánicos',
  'Blending',
] as const

export const products: Product[] = [
  {
    id: 'bio-super',
    name: 'BIO Súper',
    line: 'Orgánicos',
    description:
      'Bioestimulante orgánico soluble concentrado en aminoácidos libres.',
    image: '/images/product-bio.png',
    type: 'PDF',
  },
  {
    id: 'wayra-nitro-s',
    name: 'WAYRA Nitro S',
    line: 'Granulados',
    description: 'Nutrición localizada de nitrógeno y azufre para la siembra.',
    image: '/images/product-granulado.png',
    type: 'PDF',
  },
  {
    id: 'micro-pulse',
    name: 'MICRO + Pulse',
    line: 'Microgranulados',
    description: 'Microgranulado de arranque con micronutrientes esenciales.',
    image: '/images/product-granulado.png',
    type: 'PDF',
  },
  {
    id: 'folifeed-zn',
    name: 'FoliFeed Zn',
    line: 'Foliares',
    description: 'Corrector foliar de zinc de alta absorción.',
    image: '/images/crop-soja.png',
    type: 'PDF',
  },
  {
    id: 'hydromax-k',
    name: 'HydroMax K',
    line: 'Hidrosolubles',
    description: 'Hidrosoluble de potasio para fertirriego de precisión.',
    image: '/images/product-bio.png',
    type: 'PDF',
  },
  {
    id: 'blend-pampa',
    name: 'Blend Pampa Mix',
    line: 'Blending',
    description: 'Mezcla física balanceada según análisis de suelo.',
    image: '/images/product-granulado.png',
    type: 'PDF',
  },
  {
    id: 'folifeed-b',
    name: 'FoliFeed Boro',
    line: 'Foliares',
    description: 'Aporte foliar de boro para cuaje y llenado de grano.',
    image: '/images/crop-girasol.png',
    type: 'PDF',
  },
  {
    id: 'organic-amino',
    name: 'Amino Raíz',
    line: 'Orgánicos',
    description: 'Bioestimulante radical para una implantación eficiente.',
    image: '/images/soil-hands.png',
    type: 'PDF',
  },
  {
    id: 'micro-start',
    name: 'MICRO Start',
    line: 'Microgranulados',
    description: 'Microgranulado de fósforo y zinc para arranque vigoroso.',
    image: '/images/crop-maiz.png',
    type: 'PDF',
  },
]

export type BrandAsset = {
  title: string
  format: string
  description: string
}

export const brandSections: { heading: string; assets: BrandAsset[] }[] = [
  {
    heading: 'Logos PNG',
    assets: [
      { title: 'Logo Principal PNG', format: 'PNG', description: 'Fondo transparente · alta resolución' },
      { title: 'Logo Blanco PNG', format: 'PNG', description: 'Para fondos oscuros' },
      { title: 'Isotipo PNG', format: 'PNG', description: 'Símbolo aislado' },
    ],
  },
  {
    heading: 'Logos SVG',
    assets: [
      { title: 'Logo Principal SVG', format: 'SVG', description: 'Vectorial escalable' },
      { title: 'Logo + Slogan SVG', format: 'SVG', description: 'Lock-up institucional' },
      { title: 'Isotipo SVG', format: 'SVG', description: 'Símbolo vectorial' },
    ],
  },
  {
    heading: 'Logos PDF',
    assets: [
      { title: 'Logo para Imprenta', format: 'PDF', description: 'CMYK · alta calidad' },
      { title: 'Versión Escala de Grises', format: 'PDF', description: 'Aplicación monocromática' },
    ],
  },
  {
    heading: 'Manual de Marca',
    assets: [
      { title: 'Manual de Identidad Completo', format: 'PDF', description: '68 páginas · 32 MB' },
      { title: 'Guía Rápida de Uso', format: 'PDF', description: 'Resumen de aplicaciones' },
    ],
  },
  {
    heading: 'Presentaciones Institucionales',
    assets: [
      { title: 'Presentación Corporativa', format: 'PPTX', description: 'Plantilla editable' },
      { title: 'Presentación Comercial', format: 'PPTX', description: 'Para clientes y distribuidores' },
    ],
  },
]

export type GalleryImage = {
  id: string
  title: string
  category: string
  image: string
}

export const imageCategories = [
  'Cultivos',
  'Productos',
  'Institucional',
  'Personas',
  'Campos',
] as const

export const galleryImages: GalleryImage[] = [
  { id: 'g1', title: 'Trigo en cosecha', category: 'Cultivos', image: '/images/crop-trigo.png' },
  { id: 'g2', title: 'Maíz en desarrollo', category: 'Cultivos', image: '/images/crop-maiz.png' },
  { id: 'g3', title: 'Soja productiva', category: 'Cultivos', image: '/images/crop-soja.png' },
  { id: 'g4', title: 'Girasol en floración', category: 'Cultivos', image: '/images/crop-girasol.png' },
  { id: 'g5', title: 'Suelo y semilla', category: 'Institucional', image: '/images/soil-hands.png' },
  { id: 'g6', title: 'Agrónomos en campo', category: 'Personas', image: '/images/people-field.png' },
  { id: 'g7', title: 'Vista aérea de lotes', category: 'Campos', image: '/images/field-aerial.png' },
  { id: 'g8', title: 'Producto en pack', category: 'Productos', image: '/images/product-bio.png' },
  { id: 'g9', title: 'Granulado sobre suelo', category: 'Productos', image: '/images/product-granulado.png' },
  { id: 'g10', title: 'Campo al atardecer', category: 'Campos', image: '/images/campaign-trigo.png' },
  { id: 'g11', title: 'Hojas de cultivo', category: 'Cultivos', image: '/images/crop-soja.png' },
  { id: 'g12', title: 'Equipo técnico', category: 'Personas', image: '/images/people-field.png' },
]

export type VideoItem = {
  id: string
  title: string
  duration: string
  category: string
  image: string
}

export const videos: VideoItem[] = [
  { id: 'v1', title: 'Institucional Amauta — 10 Años', duration: '2:45', category: 'Institucional', image: '/images/field-aerial.png' },
  { id: 'v2', title: 'Cómo aplicar BIO Súper', duration: '1:30', category: 'Producto', image: '/images/product-granulado.png' },
  { id: 'v3', title: 'Campaña SabioTrigo', duration: '0:45', category: 'Campaña', image: '/images/campaign-trigo.png' },
  { id: 'v4', title: 'Testimonios de productores', duration: '3:10', category: 'Institucional', image: '/images/people-field.png' },
  { id: 'v5', title: 'Webinar: Nutrición de precisión', duration: '48:20', category: 'Webinar', image: '/images/crop-maiz.png' },
  { id: 'v6', title: 'Recorrida a campo — Maíz', duration: '4:05', category: 'Campo', image: '/images/crop-girasol.png' },
]

export type Campaign = {
  id: string
  title: string
  description: string
  assets: number
  image: string
  status: 'Activa' | 'Próxima' | 'Permanente'
}

export const campaigns: Campaign[] = [
  { id: 'c1', title: 'Amauta 10 Años', description: 'Aniversario institucional de la marca.', assets: 42, image: '/images/field-aerial.png', status: 'Activa' },
  { id: 'c2', title: 'Campaña Trigo', description: 'SabioTrigo — nutrición que rinde.', assets: 28, image: '/images/campaign-trigo.png', status: 'Activa' },
  { id: 'c3', title: 'Campaña Maíz', description: 'Más rendimiento desde el arranque.', assets: 24, image: '/images/crop-maiz.png', status: 'Próxima' },
  { id: 'c4', title: 'Campaña Soja', description: 'SabiaSoja — implantación eficiente.', assets: 31, image: '/images/crop-soja.png', status: 'Próxima' },
  { id: 'c5', title: 'Institucional', description: 'Piezas evergreen de marca.', assets: 56, image: '/images/soil-hands.png', status: 'Permanente' },
  { id: 'c6', title: 'Webinars', description: 'Ciclo de capacitación técnica.', assets: 12, image: '/images/people-field.png', status: 'Activa' },
]
