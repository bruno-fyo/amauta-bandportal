'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { upload } from '@vercel/blob/client'
import { UploadCloud, Loader2, CheckCircle2, AlertCircle, FileUp, X } from 'lucide-react'
import { saveAssetRecord } from '@/app/actions/assets'
import { CATEGORIES, FILE_TYPES } from '@/lib/categories'
import { ROLE_LABELS, ROLES, type Role } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

// El administrador siempre tiene acceso a todo el material, por eso no se
// ofrece como opción de visibilidad: solo se eligen los demás roles.
const SELECTABLE_VISIBILITY: Role[] = ROLES.filter((r) => r !== 'admin')

const inputClass =
  'h-11 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15'

export function AssetUploadForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [visibility, setVisibility] = useState<Role[]>(['distribuidor', 'comercial'])
  const [fileName, setFileName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
    if (!file || file.size === 0) return setError('Adjuntá un archivo para cargar.')

    const tags = tagsRaw
      ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    setLoading(true)
    setProgress(0)

    try {
      // Carga directa del navegador a Vercel Blob (soporta archivos grandes).
      const blob = await upload(`assets/${category}/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/assets/upload',
        multipart: true,
        onUploadProgress: (e) => setProgress(Math.round(e.percentage)),
      })

      // Registro del asset en la base de datos.
      const result = await saveAssetRecord({
        title,
        description,
        category,
        fileType,
        tags,
        visibility,
        fileName: file.name,
        filePathname: blob.pathname,
        fileUrl: blob.url,
        fileSize: file.size,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      setSuccess(true)
      setFileName(null)
      formRef.current?.reset()
      setVisibility(['distribuidor', 'comercial'])
      router.refresh()
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      console.error('[v0] upload error:', err)
      setError('No se pudo subir el archivo. Verificá el tamaño y volvé a intentar.')
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
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
          <span>Material cargado correctamente.</span>
        </div>
      )}

      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-foreground">
          Título <span className="text-destructive">*</span>
        </label>
        <input id="title" name="title" required className={inputClass} placeholder="Ej. Manual de Identidad de Marca" />
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-semibold text-foreground">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className={cn(inputClass, 'h-auto resize-y py-3')}
          placeholder="Breve descripción del recurso…"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm font-semibold text-foreground">
            Categoría <span className="text-destructive">*</span>
          </label>
          <select id="category" name="category" required defaultValue="" className={inputClass}>
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
          <label htmlFor="fileType" className="mb-1.5 block text-sm font-semibold text-foreground">
            Tipo de archivo <span className="text-destructive">*</span>
          </label>
          <select id="fileType" name="fileType" required defaultValue="" className={inputClass}>
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
        <label htmlFor="tags" className="mb-1.5 block text-sm font-semibold text-foreground">
          Tags
        </label>
        <input id="tags" name="tags" className={inputClass} placeholder="trigo, campaña, 2026 (separados por coma)" />
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

      {/* Archivo */}
      <div>
        <span className="mb-1.5 block text-sm font-semibold text-foreground">
          Archivo <span className="text-destructive">*</span>
        </span>
        <label
          htmlFor="file"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-6 py-8 text-center transition-colors hover:border-ring hover:bg-muted"
        >
          {fileName ? (
            <>
              <FileUp className="size-6 text-primary" aria-hidden="true" />
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                {fileName}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setFileName(null)
                    if (formRef.current) {
                      const input = formRef.current.elements.namedItem('file') as HTMLInputElement
                      if (input) input.value = ''
                    }
                  }}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Quitar archivo"
                >
                  <X className="size-4" />
                </button>
              </span>
            </>
          ) : (
            <>
              <UploadCloud className="size-7 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm font-medium text-foreground">
                Hacé clic para seleccionar un archivo
              </span>
              <span className="text-xs text-muted-foreground">
                PDF, imágenes, ZIP, presentaciones o video
              </span>
            </>
          )}
          <input
            id="file"
            name="file"
            type="file"
            required
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
      </div>

      {loading && (
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

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {progress > 0 ? `Subiendo… ${progress}%` : 'Subiendo…'}
          </>
        ) : (
          <>
            <UploadCloud className="size-4" aria-hidden="true" />
            Cargar material
          </>
        )}
      </button>
    </form>
  )
}
