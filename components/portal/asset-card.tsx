import { Download, Calendar, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_LABELS, type CategoryKey } from '@/lib/categories'
import type { Asset } from '@/lib/db/schema'

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function formatSize(bytes: number | null) {
  if (!bytes) return null
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function AssetCard({ asset }: { asset: Asset }) {
  const size = formatSize(asset.fileSize)

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-secondary">
        <FileText className="size-10 text-primary/40" aria-hidden="true" />
        <div className="absolute left-3 top-3">
          <Badge variant="solid" size="md">
            {asset.fileType}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-1 flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {CATEGORY_LABELS[asset.category as CategoryKey] ?? asset.category}
          </span>
          <h3 className="text-pretty text-base font-bold leading-snug text-foreground">
            {asset.title}
          </h3>
          {asset.description ? (
            <p className="line-clamp-2 text-pretty text-sm text-muted-foreground">
              {asset.description}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="size-3.5" aria-hidden="true" />
          <span>Actualizado {formatDate(asset.createdAt)}</span>
          {size ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{size}</span>
            </>
          ) : null}
        </div>

        {asset.filePathname ? (
          <a
            href={`/api/assets/${asset.id}/download?download=1`}
            className="mt-1 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-semibold text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
          >
            <Download className="size-4" aria-hidden="true" />
            Descargar
          </a>
        ) : (
          <span className="mt-1 inline-flex h-10 w-full items-center justify-center rounded-xl bg-muted text-sm font-semibold text-muted-foreground">
            No disponible
          </span>
        )}
      </div>
    </article>
  )
}
