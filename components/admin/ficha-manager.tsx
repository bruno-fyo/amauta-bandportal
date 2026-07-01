'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { upload } from '@vercel/blob/client'
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { deleteFicha, saveFichaRecord } from '@/app/actions/fichas'
import { PRODUCT_FAMILIES } from '@/lib/products'
import { cn } from '@/lib/utils'

type FichaInfo = {
  fileName: string | null
  fileSize: number | null
  updatedAt: string | Date
}

export function FichaManager({ fichas }: { fichas: Record<string, FichaInfo> }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function notify(kind: 'error' | 'success', message: string) {
    if (kind === 'error') {
      setError(message)
      setSuccess(null)
    } else {
      setSuccess(message)
      setError(null)
      setTimeout(() => setSuccess(null), 4000)
    }
  }

  const withFicha = Object.keys(fichas).length

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-primary"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{success}</span>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {withFicha} de{' '}
        {PRODUCT_FAMILIES.reduce((n, f) => n + f.products.length, 0)} productos con
        ficha técnica cargada.
      </p>

      {PRODUCT_FAMILIES.map((family) => (
        <div
          key={family.slug}
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-5 py-3">
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-lg font-heading text-sm font-bold text-white"
              style={{ backgroundColor: family.color }}
              aria-hidden="true"
            >
              {family.name.charAt(0)}
            </span>
            <h3 className="font-heading text-sm font-bold text-foreground">
              Familia {family.name}
            </h3>
          </div>
          <ul className="divide-y divide-border">
            {family.products.map((product) => (
              <FichaRow
                key={product.slug}
                slug={product.slug}
                name={product.name}
                color={product.color}
                ficha={fichas[product.slug] ?? null}
                onNotify={notify}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function FichaRow({
  slug,
  name,
  color,
  ficha,
  onNotify,
}: {
  slug: string
  name: string
  color: string
  ficha: FichaInfo | null
  onNotify: (kind: 'error' | 'success', message: string) => void
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'upload' | 'delete' | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      onNotify('error', `La ficha de ${name} debe ser un PDF.`)
      e.target.value = ''
      return
    }

    setBusy('upload')
    try {
      const blob = await upload(`fichas/${slug}.pdf`, file, {
        access: 'private',
        handleUploadUrl: '/api/assets/upload',
        multipart: true,
      })

      const result = await saveFichaRecord({
        slug,
        fileName: file.name,
        filePathname: blob.pathname,
        fileUrl: blob.url,
        fileSize: file.size,
      })

      if (!result.ok) {
        onNotify('error', result.error)
        return
      }
      onNotify('success', `Ficha de ${name} ${ficha ? 'actualizada' : 'cargada'}.`)
      router.refresh()
    } catch (err) {
      console.error('[v0] ficha upload error:', err)
      onNotify('error', `No se pudo subir la ficha de ${name}.`)
    } finally {
      setBusy(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar la ficha técnica de ${name}?`)) return
    setBusy('delete')
    try {
      const result = await deleteFicha(slug)
      if (!result.ok) {
        onNotify('error', result.error)
        return
      }
      onNotify('success', `Ficha de ${name} eliminada.`)
      router.refresh()
    } catch (err) {
      console.error('[v0] ficha delete error:', err)
      onNotify('error', `No se pudo eliminar la ficha de ${name}.`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3">
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        {ficha ? (
          <p className="truncate text-xs text-muted-foreground">
            {ficha.fileName ?? 'ficha.pdf'}
            {ficha.fileSize ? ` · ${formatSize(ficha.fileSize)}` : ''}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Sin ficha técnica</p>
        )}
      </div>

      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
          ficha
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {ficha ? (
          <>
            <CheckCircle2 className="size-3" aria-hidden="true" />
            Cargada
          </>
        ) : (
          <>
            <FileText className="size-3" aria-hidden="true" />
            Pendiente
          </>
        )}
      </span>

      <div className="flex items-center gap-2">
        {ficha ? (
          <a
            href={`/api/fichas/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={`Ver ficha de ${name}`}
            title="Ver ficha"
          >
            <Download className="size-4" aria-hidden="true" />
          </a>
        ) : null}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy !== null}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy === 'upload' ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <UploadCloud className="size-3.5" aria-hidden="true" />
          )}
          {ficha ? 'Reemplazar' : 'Subir'}
        </button>

        {ficha ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy !== null}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:opacity-60"
            aria-label={`Eliminar ficha de ${name}`}
            title="Eliminar ficha"
          >
            {busy === 'delete' ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="size-4" aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={handleFile}
      />
    </li>
  )
}
