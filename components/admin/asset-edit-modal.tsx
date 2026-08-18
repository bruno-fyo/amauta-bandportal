'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { upload } from '@vercel/blob/client'
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileUp,
  X,
  UploadCloud,
  RefreshCw,
} from 'lucide-react'
import { updateAsset } from '@/app/actions/assets'
import { CATEGORIES, FILE_TYPES } from '@/lib/categories'
import { ROLE_LABELS, ROLES, type Asset, type Role } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

// El administrador siempre tiene acceso a todo el material, por eso no se
// ofrece como opción de visibilidad: solo se eligen los demás roles.
const SELECTABLE_VISIBILITY: Role[] = ROLES.filter((r) => r !== 'admin')

const inputClass =
  'h-11 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15'

export function AssetEditModal({
  asset,
  onClose,
}: {
  asset: Asset
  onClose: () => void
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [visibility, setVisibility] = useState<Role[]>(
    asset.visibility.filter((r): r is Role => r !== 'admin'),
  )
  // Archivo nuevo seleccionado para reemplazar el actual (opcional).
  const [newFileName, setNewFileName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Cerrar con Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, loading])

  function toggleRole(role: Role) {
    setVisibility((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const title = String(formData.get('title') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const category = String(formData.get('category') ?? '').trim()
    const fileType = String(formData.get('fileType') ?? '').trim()
    const tagsRaw = String(formData.get('tags') ?? '').trim()
    const file = formData.get('file') as File | null

    if (!title) return setError('El título es obligatorio.')
    if (!category) return setError('Seleccioná una categoría.')
    if (!fileType) return setError('Seleccioná el tipo de archivo.')
    if (visibility.length === 0)
      return setError('Seleccioná al menos un rol con visibilidad.')

    const tags = tagsRaw
      ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    setLoading(true)
    setProgress(0)

    try {
      // Datos de archivo: solo si el admin seleccionó uno nuevo.
      let fileData:
        | { fileName: string; filePathname: string; fileUrl: string; fileSize: number }
        | undefined

      if (file && file.size > 0) {
        const blob = await upload(`assets/${category}/${file.name}`, file, {
          access: 'private',
          handleUploadUrl: '/api/assets/upload',
          multipart: true,
          onUploadProgress: (e) => setProgress(Math.round(e.percentage)),
        })
        fileData = {
          fileName: file.name,
          filePathname: blob.pathname,
          fileUrl: blob.url,
          fileSize: file.size,
        }
      }

      const result = await updateAsset({
        id: asset.id,
        title,
        description,
        category,
        fileType,
        tags,
        visibility,
        ...fileData,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      setSuccess(true)
      router.refresh()
      // Cerrar poco después para que se vea la confirmación.
      setTimeout(() => onClose(), 700)
    } catch (err) {
      console.error('[v0] updateAsset upload error:', err)
      setError('No se pudo guardar. Verificá el archivo y volvé a intentar.')
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-asset-title"
      onMouseDown={(e) => {
        // Cerrar al hacer clic fuera del panel (no mientras sube).
        if (e.target === e.currentTarget && !loading) onClose()
      }}
    >
      <div className="my-8 w-full max-w-lg rounded-2xl border border-border bg-background shadow-xl">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="edit-asset-title" className="text-base font-bold text-foreground">
            Editar material
          </h2>
          <button
            type="button"
            onClick={() => !loading && onClose()}
            disabled={loading}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5 p-5">
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
              <span>Cambios guardados correctamente.</span>
            </div>
          )}

          <div>
            <label htmlFor="edit-title" className="mb-1.5 block text-sm font-semibold text-foreground">
              Título <span className="text-destructive">*</span>
            </label>
            <input
              id="edit-title"
              name="title"
              required
              defaultValue={asset.title}
              className={inputClass}
              placeholder="Ej. Manual de Identidad de Marca"
            />
          </div>

          <div>
            <label htmlFor="edit-description" className="mb-1.5 block text-sm font-semibold text-foreground">
              Descripción
            </label>
            <textarea
              id="edit-description"
              name="description"
              rows={3}
              defaultValue={asset.description ?? ''}
              className={cn(inputClass, 'h-auto resize-y py-3')}
              placeholder="Breve descripción del recurso…"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-category" className="mb-1.5 block text-sm font-semibold text-foreground">
                Categoría <span className="text-destructive">*</span>
              </label>
              <select
                id="edit-category"
                name="category"
                required
                defaultValue={asset.category}
                className={inputClass}
              >
                <option value="" disabled>
                  Seleccionar categoría
                </option>
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-fileType" className="mb-1.5 block text-sm font-semibold text-foreground">
                Tipo de archivo <span className="text-destructive">*</span>
              </label>
              <select
                id="edit-fileType"
                name="fileType"
                required
                defaultValue={asset.fileType}
                className={inputClass}
              >
                <option value="" disabled>
                  Seleccionar tipo
                </option>
                {FILE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="edit-tags" className="mb-1.5 block text-sm font-semibold text-foreground">
              Tags
            </label>
            <input
              id="edit-tags"
              name="tags"
              defaultValue={asset.tags.join(', ')}
              className={inputClass}
              placeholder="trigo, campaña, 2026 (separados por coma)"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">Separá las etiquetas con comas.</p>
          </div>

          {/* Visibilidad por rol */}
          <div>
            <span className="mb-1 block text-sm font-semibold text-foreground">
              Visibilidad por rol <span className="text-destructive">*</span>
            </span>
            <p className="mb-2 text-xs text-muted-foreground">
              El administrador siempre tiene acceso a todo el material.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SELECTABLE_VISIBILITY.map((role) => {
                const active = visibility.includes(role)
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    aria-pressed={active}
                    className={cn(
                      'flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-colors',
                      active
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {ROLE_LABELS[role]}
                    <span
                      className={cn(
                        'flex size-4 items-center justify-center rounded-md border',
                        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                      )}
                    >
                      {active && <CheckCircle2 className="size-3.5" aria-hidden="true" />}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reemplazo de archivo (opcional) */}
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-foreground">
              Archivo
            </span>
            <p className="mb-2 text-xs text-muted-foreground">
              Archivo actual:{' '}
              <span className="font-medium text-foreground">{asset.fileName ?? '—'}</span>. Subí uno
              nuevo solo si querés reemplazarlo.
            </p>
            <label
              htmlFor="edit-file"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-6 py-6 text-center transition-colors hover:border-ring hover:bg-muted"
            >
              {newFileName ? (
                <>
                  <FileUp className="size-6 text-primary" aria-hidden="true" />
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {newFileName}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        setNewFileName(null)
                        if (formRef.current) {
                          const input = formRef.current.elements.namedItem('file') as HTMLInputElement
                          if (input) input.value = ''
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Quitar archivo nuevo"
                    >
                      <X className="size-4" />
                    </button>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Reemplazará al archivo actual al guardar.
                  </span>
                </>
              ) : (
                <>
                  <RefreshCw className="size-6 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground">
                    Hacé clic para reemplazar el archivo
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF, imágenes, ZIP, presentaciones o video
                  </span>
                </>
              )}
              <input
                id="edit-file"
                name="file"
                type="file"
                className="sr-only"
                onChange={(e) => setNewFileName(e.target.files?.[0]?.name ?? null)}
              />
            </label>
          </div>

          {loading && progress > 0 && (
            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progreso de carga"
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => !loading && onClose()}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {progress > 0 ? `Subiendo… ${progress}%` : 'Guardando…'}
                </>
              ) : (
                <>
                  <UploadCloud className="size-4" aria-hidden="true" />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
