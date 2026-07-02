'use client'

import { useState } from 'react'
import { ChevronDown, Download, ImageIcon, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Flag } from '@/components/portal/flag'
import { FICHA_COUNTRY_LABELS } from '@/lib/db/schema'
import type { CatalogFamily, CatalogProduct } from '@/app/actions/catalog'

export function ProductCatalog({ families }: { families: CatalogFamily[] }) {
  // La primera familia arranca abierta; el resto se despliega al hacer clic.
  const [open, setOpen] = useState<Record<string, boolean>>({
    [families[0]?.id ?? '']: true,
  })

  function toggle(id: string) {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex flex-col gap-4">
      {families.map((family) => (
        <FamilyPanel
          key={family.id}
          family={family}
          isOpen={!!open[family.id]}
          onToggle={() => toggle(family.id)}
        />
      ))}
    </div>
  )
}

function FamilyPanel({
  family,
  isOpen,
  onToggle,
}: {
  family: CatalogFamily
  isOpen: boolean
  onToggle: () => void
}) {
  const panelId = `family-panel-${family.id}`

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
            {family.type ? (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: `${family.color}1a`,
                  color: family.color,
                }}
              >
                {family.type}
              </span>
            ) : null}
          </div>
          {family.description ? (
            <p className="mt-1 line-clamp-2 text-pretty text-sm text-muted-foreground">
              {family.description}
            </p>
          ) : null}
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
        <div id={panelId} className="border-t border-border bg-muted/30 p-5">
          {family.products.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Esta familia todavía no tiene productos.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {family.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  familyName={family.name}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}

function ProductCard({
  product,
  familyName,
}: {
  product: CatalogProduct
  familyName: string
}) {
  const [imgError, setImgError] = useState(false)
  const showImage = !!product.imageUrl && !imgError

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
            src={product.imageUrl as string}
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
              {familyName}
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

        <ProductDownloads product={product} />
      </div>
    </article>
  )
}

function ProductDownloads({ product }: { product: CatalogProduct }) {
  const hasAnything =
    product.logoUrl ||
    product.images.length > 0 ||
    product.hasFichaAr ||
    product.hasFichaUy

  if (!hasAnything) {
    return (
      <span className="mt-auto inline-flex h-9 w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-lg bg-muted px-2 text-xs font-semibold text-muted-foreground">
        Material próximamente
      </span>
    )
  }

  return (
    <div className="mt-auto flex flex-col gap-2">
      {/* Fichas técnicas por país */}
      {(product.hasFichaAr || product.hasFichaUy) && (
        <div className="flex flex-col gap-1.5">
          {product.hasFichaAr ? (
            <FichaLink slug={product.slug} country="ar" />
          ) : null}
          {product.hasFichaUy ? (
            <FichaLink slug={product.slug} country="uy" />
          ) : null}
        </div>
      )}

      {/* Logo e imágenes */}
      {(product.logoUrl || product.images.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {product.logoUrl ? (
            <a
              href={product.logoUrl}
              download
              className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-2 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted"
              title={`Descargar logo de ${product.name}`}
            >
              <Download className="size-3" aria-hidden="true" />
              Logo
            </a>
          ) : null}
          {product.images.length > 0 ? (
            <a
              href={product.images[0].fileUrl}
              download
              className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-2 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted"
              title={`Descargar imagen de ${product.name}`}
            >
              <ImageIcon className="size-3" aria-hidden="true" />
              {product.images.length > 1
                ? `Imágenes (${product.images.length})`
                : 'Imagen'}
            </a>
          ) : null}
        </div>
      )}

      {/* Imágenes adicionales (a partir de la segunda) */}
      {product.images.length > 1 ? (
        <div className="flex flex-wrap gap-1.5">
          {product.images.slice(1).map((img, i) => (
            <a
              key={img.id}
              href={img.fileUrl}
              download
              className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title={img.fileName ?? `Imagen ${i + 2}`}
              aria-label={`Descargar imagen ${i + 2} de ${product.name}`}
            >
              <Download className="size-3" aria-hidden="true" />
            </a>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function FichaLink({ slug, country }: { slug: string; country: 'ar' | 'uy' }) {
  return (
    <a
      href={`/api/fichas/${slug}?country=${country}&download=1`}
      className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
    >
      <Flag country={country} className="h-3 w-[18px]" />
      Ficha {FICHA_COUNTRY_LABELS[country]}
      <Download className="size-3.5" aria-hidden="true" />
    </a>
  )
}
