'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Download, FileText, ImageOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Asset } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

type Layout = 'grid' | 'masonry' | 'square'

const IMAGE_TYPES = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif']

function isImage(asset: Asset) {
  return (
    !!asset.fileUrl &&
    IMAGE_TYPES.includes((asset.fileType || '').toLowerCase())
  )
}

function AssetThumb({ asset, className }: { asset: Asset; className?: string }) {
  if (isImage(asset)) {
    return (
      <Image
        src={asset.fileUrl as string}
        alt={asset.title}
        fill
        sizes="(max-width: 768px) 100vw, 360px"
        className={cn(
          'object-cover transition-transform duration-500 group-hover:scale-105',
          className,
        )}
      />
    )
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary text-secondary-foreground">
      <FileText className="size-8" aria-hidden="true" />
      <span className="font-mono text-xs font-bold uppercase">
        {asset.fileType}
      </span>
    </div>
  )
}

export function AssetExplorer({
  assets,
  layout = 'grid',
  showFilters = true,
  emptyTitle = 'Aún no hay piezas cargadas',
  emptyDescription = 'El equipo de Marketing irá publicando el material oficial en esta sección.',
}: {
  assets: Asset[]
  layout?: Layout
  showFilters?: boolean
  emptyTitle?: string
  emptyDescription?: string
}) {
  const tags = useMemo(() => {
    const set = new Set<string>()
    assets.forEach((a) => a.tags?.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [assets])

  const [active, setActive] = useState<string>('Todos')

  const filtered =
    active === 'Todos'
      ? assets
      : assets.filter((a) => a.tags?.includes(active))

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ImageOff className="size-5" aria-hidden="true" />
        </span>
        <p className="font-heading text-lg font-bold text-foreground">
          {emptyTitle}
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {emptyDescription}
        </p>
      </div>
    )
  }

  return (
    <div>
      {showFilters && tags.length > 0 ? (
        <div className="mb-8 flex flex-wrap gap-2">
          {['Todos', ...tags].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActive(t)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                active === t
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-foreground hover:bg-muted',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      ) : null}

      {layout === 'masonry' ? (
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
          {filtered.map((asset) => (
            <figure
              key={asset.id}
              className="group relative break-inside-avoid overflow-hidden rounded-2xl border border-border bg-muted shadow-sm"
            >
              <div className="relative aspect-[4/3] w-full">
                <AssetThumb asset={asset} />
              </div>
              <figcaption className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#1d1b16]/80 via-transparent to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#fcf9f6]">
                      {asset.title}
                    </p>
                    {asset.description ? (
                      <p className="truncate text-xs text-[#fcf9f6]/70">
                        {asset.description}
                      </p>
                    ) : null}
                  </div>
                  <DownloadButton asset={asset} variant="overlay" />
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div
          className={cn(
            'grid gap-5',
            layout === 'square'
              ? 'grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
          )}
        >
          {filtered.map((asset) => (
            <article
              key={asset.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div
                className={cn(
                  'relative overflow-hidden bg-muted',
                  layout === 'square' ? 'aspect-square' : 'aspect-[16/11]',
                )}
              >
                <AssetThumb asset={asset} />
                <div className="absolute left-3 top-3">
                  <Badge variant="accent" size="sm">
                    {(asset.fileType || 'archivo').toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h3 className="font-heading text-base font-bold text-foreground">
                  {asset.title}
                </h3>
                {asset.description ? (
                  <p className="flex-1 text-pretty text-sm text-muted-foreground">
                    {asset.description}
                  </p>
                ) : null}
                {asset.tags && asset.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {asset.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-3">
                  <DownloadButton asset={asset} variant="full" />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No hay piezas con el filtro seleccionado.
          </p>
        </div>
      ) : null}
    </div>
  )
}

function DownloadButton({
  asset,
  variant,
}: {
  asset: Asset
  variant: 'full' | 'overlay'
}) {
  const disabled = !asset.fileUrl
  const baseLabel = disabled ? 'Archivo no disponible' : 'Descargar'

  if (variant === 'overlay') {
    return (
      <a
        href={asset.fileUrl ?? '#'}
        download={asset.fileName ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={disabled}
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-opacity hover:opacity-90',
          disabled && 'pointer-events-none opacity-50',
        )}
        aria-label={`${baseLabel} ${asset.title}`}
      >
        <Download className="size-4" />
      </a>
    )
  }

  return (
    <a
      href={asset.fileUrl ?? '#'}
      download={asset.fileName ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={disabled}
      className={cn(
        'inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <Download className="size-4" aria-hidden="true" />
      {baseLabel}
    </a>
  )
}
