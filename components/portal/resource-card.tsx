import Image from 'next/image'
import { Download, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Resource } from '@/lib/data'

export function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <Image
          src={resource.image || '/placeholder.svg'}
          alt={resource.title}
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3">
          <Badge variant="solid" size="md">
            {resource.type}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-1 flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {resource.category}
          </span>
          <h3 className="text-pretty text-base font-bold leading-snug text-foreground">
            {resource.title}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="size-3.5" aria-hidden="true" />
          <span>Actualizado {resource.updated}</span>
          {resource.size ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{resource.size}</span>
            </>
          ) : null}
        </div>

        <button
          type="button"
          className="mt-1 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-semibold text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
        >
          <Download className="size-4" aria-hidden="true" />
          Descargar
        </button>
      </div>
    </article>
  )
}
