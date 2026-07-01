// Catálogo de productos Amauta, organizado por familia.
// Los colores provienen del Manual de Identidad de Productos.
//
// Imágenes: colocar el PNG de cada producto en `public/products/<slug>.png`.
// Fichas técnicas: colocar el PDF en `public/products/fichas/<slug>.pdf`
// y marcar `ficha: true` para habilitar el botón de descarga.

export type Product = {
  slug: string
  name: string
  /** Color de marca del producto (chip identificador). */
  color: string
  /** ¿Ya existe la ficha técnica en public/products/fichas/<slug>.pdf? */
  ficha?: boolean
  /** Marcar productos nuevos del rebranding. */
  isNew?: boolean
}

export type ProductFamily = {
  slug: string
  /** Nombre de la familia, ej. "MICRO+". */
  name: string
  /** Tipo / categoría, ej. "Microgranulados". */
  type: string
  /** Color principal de la familia. */
  color: string
  description: string
  products: Product[]
}

export const PRODUCT_FAMILIES: ProductFamily[] = [
  {
    slug: 'micro',
    name: 'MICRO+',
    type: 'Microgranulados',
    color: '#6CC24A',
    description:
      'Microgranulados de arranque que aportan fósforo y micronutrientes de alta eficiencia en la línea de siembra.',
    products: [
      { slug: 'micro-10-40', name: 'Micro+ 10-40', color: '#FA4616' },
      { slug: 'micro-10-27', name: 'Micro+ 10-27', color: '#F2A900' },
      { slug: 'micro-plus', name: 'Micro+ Plus', color: '#003057' },
      { slug: 'micro-pulse', name: 'Micro+ Pulse', color: '#4A9D3A', isNew: true },
    ],
  },
  {
    slug: 'wanla',
    name: 'WANLA',
    type: 'Soluciones Blending',
    color: '#E35205',
    description:
      'Soluciones de blending nitrogenadas y con zinc para potenciar la fertilización de base.',
    products: [
      { slug: 'wanla-u', name: 'Wanla U', color: '#E35205' },
      { slug: 'wanla-u-plus', name: 'Wanla U Plus', color: '#FF8F1C' },
      { slug: 'wanla-u-s-plus', name: 'Wanla U S Plus', color: '#EA7600' },
      { slug: 'wanla-zn', name: 'Wanla Zn', color: '#D45D00' },
    ],
  },
  {
    slug: 'safi',
    name: 'SAFI',
    type: 'Hidrosolubles',
    color: '#0072C6',
    description:
      'Fertilizantes hidrosolubles de nitrógeno, fósforo y potasio para fertirriego y aplicaciones dirigidas.',
    products: [
      { slug: 'safi-nitro', name: 'Safi Nitro', color: '#002F6C' },
      { slug: 'safi-phos', name: 'Safi Phos', color: '#0072C6' },
      { slug: 'safi-kali', name: 'Safi Kali', color: '#00AEC7' },
    ],
  },
  {
    slug: 'bio',
    name: 'BIO',
    type: 'Orgánicos',
    color: '#00A651',
    description:
      'Línea orgánica y organomineral que mejora la fertilidad del suelo y el desarrollo radicular.',
    products: [
      { slug: 'bio-fertil', name: 'Bio Fértil', color: '#007A33' },
      { slug: 'bio-amino-plus', name: 'Bio Amino Plus', color: '#00A651' },
      { slug: 'bio-super', name: 'Bio Súper', color: '#64A70B' },
    ],
  },
  {
    slug: 'wayra',
    name: 'WAYRA',
    type: 'Foliares',
    color: '#6D4C88',
    description:
      'Nutrición foliar de precisión: nitrógeno, potasio, aminoácidos y micronutrientes para cada momento del cultivo.',
    products: [
      { slug: 'wayra-nitro', name: 'Wayra Nitro', color: '#3F2154' },
      { slug: 'wayra-nitro-s', name: 'Wayra Nitro S', color: '#6D4C88' },
      { slug: 'wayra-k', name: 'Wayra K', color: '#8B2260' },
      { slug: 'wayra-cuaje', name: 'Wayra Cuaje', color: '#B266A0' },
      { slug: 'wayra-amino', name: 'Wayra Amino', color: '#A56FA0' },
      { slug: 'wayra-boro', name: 'Wayra Boro', color: '#9C6FA8' },
      { slug: 'wayra-ziman', name: 'Wayra Ziman', color: '#993399' },
    ],
  },
  {
    slug: 'alpa',
    name: 'ALPA',
    type: 'Granulados Tech',
    color: '#B08B60',
    description:
      'Granulados de tecnología avanzada que optimizan la eficiencia del nitrógeno y el balance NPK.',
    products: [
      { slug: 'alpa-npk', name: 'Alpa NPK', color: '#B08B60' },
      { slug: 'alpa-n', name: 'Alpa N', color: '#372114' },
    ],
  },
]

export const TOTAL_PRODUCTS = PRODUCT_FAMILIES.reduce(
  (acc, f) => acc + f.products.length,
  0,
)
