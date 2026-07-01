'use client'

import { useState } from 'react'
import { ChevronDown, Download, FileText, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PRODUCT_FAMILIES,
  type Product,
  type ProductFamily,
} from '@/lib/products'

// Conjunto de slugs que tienen ficha técnica cargada en la base de datos.
export function ProductCatalog({ fichaSlugs = [] }: { fichaSlugs?: string[] }) {
  // La primera familia arranca abierta; el resto se despliega al hacer clic.
  const [open, setOpen] = useState<Record<string, boolean>>({
    [PRODUCT_FAMILIES[0]?.slug ?? '']: true,
  })

  const fichaSet = new Set(fichaSlugs)

  function toggle(slug: string) {
    setOpen((prev) => ({ ...prev, [slug]: !prev[slug] }))
  }

  return (
    <div className="flex flex-col gap-4">
      {PRODUCT_FAMILIES.map((family) => (
        <FamilyPanel
          key={family.slug}
          family={family}
          isOpen={!!open[family.slug]}
          onToggle={() => toggle(family.slug)}
          fichaSet={fichaSet}
        />
      ))}
    </div>
  )
}

function FamilyPanel({
  family,
  isOpen,
  onToggle,
  fichaSet,
}: {
  family: ProductFamily
  isOpen: boolean
  onToggle: () => void
  fichaSet: Set<string>
}) {
  const panelId = `family-panel-${family.slug}`

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-muted/60"
      >
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-xl font-heading text-lg font-bold text-white"
          style={{ backgroundColor: family.color }}
          aria-hidden="true"
        >
          {family.name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
              Familia {family.name}
            </h2>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{
                backgroundColor: `${family.color}1a`,
                color: family.color,
              }}
            >
              {family.type}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-pretty text-sm text-muted-foreground">
            {family.description}
          </p>
        </div>
        <span className="hidden shrink-0 text-sm font-semibold text-muted-foreground sm:block">
          {family.products.length}{' '}
          {family.products.length === 1 ? 'producto' : 'productos'}
        </span>
        <ChevronDown
          className={cn(
            'size-5 shrink-0 text-muted-foreground transition-transform duration-300',
            isOpen && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          id={panelId}
          className="border-t border-border bg-muted/30 p-5"
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {family.products.map((product) => (
              <ProductCard
                key={product.slug}
                product={product}
                family={family}
                hasFicha={fichaSet.has(product.slug)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function ProductCard({
  product,
  family,
  hasFicha,
}: {
  product: Product
  family: ProductFamily
  hasFicha: boolean
}) {
  const [imgError, setImgError] = useState(false)
  const showImage = !imgError

  // La imagen puede fallar antes de que React hidrate y "pierda" el onError.
  // Con un ref detectamos las imágenes que ya fallaron al montar el componente.
  const handleRef = (node: HTMLImageElement | null) => {
    if (node && node.complete && node.naturalWidth === 0) {
      setImgError(true)
    }
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <div className="relative aspect-square w-full overflow-hidden">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={handleRef}
            src={`/products/${product.slug}.png`}
            alt={product.name}
            onError={() => setImgError(true)}
            className="absolute inset-0 h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center"
            style={{
              background: `linear-gradient(150deg, ${product.color} 0%, ${product.color}cc 100%)`,
            }}
          >
            <span className="font-heading text-base font-bold leading-tight text-white">
              {product.name}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
              {family.name}
            </span>
          </div>
        )}
        {product.isNew ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-foreground">
            <Sparkles className="size-3" aria-hidden="true" />
            Nuevo
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-2">
          <span
            className="mt-1 size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: product.color }}
            aria-hidden="true"
          />
          <h3 className="font-heading text-sm font-bold leading-tight text-foreground">
            {product.name}
          </h3>
        </div>

        <FichaButton product={product} hasFicha={hasFicha} />
      </div>
    </article>
  )
}

function FichaButton({ product, hasFicha }: { product: Product; hasFicha: boolean }) {
  if (hasFicha) {
    return (
      <a
        href={`/api/fichas/${product.slug}?download=1`}
        className="mt-auto inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Download className="size-3.5" aria-hidden="true" />
        Descargar ficha técnica
      </a>
    )
  }

  return (
    <span
      className="mt-auto inline-flex h-9 w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-lg bg-muted px-2 text-xs font-semibold text-muted-foreground"
      title="La ficha técnica estará disponible próximamente"
    >
      <FileText className="size-3.5" aria-hidden="true" />
      Ficha próximamente
    </span>
  )
}
