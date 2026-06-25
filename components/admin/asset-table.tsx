'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, FileText, Eye, Inbox } from 'lucide-react'
import { deleteAsset } from '@/app/actions/assets'
import { CATEGORY_LABELS, type CategoryKey } from '@/lib/categories'
import { ROLE_LABELS, type Asset, type Role } from '@/lib/db/schema'

function formatSize(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function AssetTable({ assets }: { assets: Asset[] }) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(id: number, title: string) {
    if (!confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return
    setError(null)
    setDeletingId(id)
    const result = await deleteAsset(id)
    setDeletingId(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
          <Inbox className="size-6 text-muted-foreground" aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm font-semibold text-foreground">
          Todavía no hay assets cargados
        </p>
        <p className="mt-1 max-w-xs text-pretty text-sm text-muted-foreground">
          Usá el formulario para cargar el primer recurso del portal.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {error && (
        <div role="alert" className="border-b border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Asset</th>
              <th className="px-4 py-3 font-semibold">Categoría</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold">Visibilidad</th>
              <th className="px-4 py-3 font-semibold">Tamaño</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                      <FileText className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{asset.title}</p>
                      {asset.tags.length > 0 && (
                        <p className="truncate text-xs text-muted-foreground">
                          {asset.tags.join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {CATEGORY_LABELS[asset.category as CategoryKey] ?? asset.category}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                    {asset.fileType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {asset.visibility.map((r) => (
                      <span
                        key={r}
                        className="rounded-md border border-border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {ROLE_LABELS[r as Role]}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatSize(asset.fileSize)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {asset.fileUrl && (
                      <a
                        href={asset.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={`Ver ${asset.title}`}
                      >
                        <Eye className="size-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(asset.id, asset.title)}
                      disabled={deletingId === asset.id}
                      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      aria-label={`Eliminar ${asset.title}`}
                    >
                      {deletingId === asset.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
