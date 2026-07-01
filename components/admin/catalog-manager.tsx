'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { upload } from '@vercel/blob/client'
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  FolderPlus,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import {
  createFamily,
  createProduct,
  deleteFamily,
  deleteProduct,
  updateFamily,
  updateProduct,
  type CatalogFamily,
} from '@/app/actions/catalog'
import { deleteFicha, saveFichaRecord } from '@/app/actions/fichas'
import { cn } from '@/lib/utils'

type FichaInfo = {
  fileName: string | null
  fileSize: number | null
  updatedAt: string | Date
}

type Notify = (kind: 'error' | 'success', message: string) => void

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export function CatalogManager({
  families,
  fichas,
}: {
  families: CatalogFamily[]
  fichas: Record<string, FichaInfo>
}) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showNewFamily, setShowNewFamily] = useState(false)

  const notify: Notify = (kind, message) => {
    if (kind === 'error') {
      setError(message)
      setSuccess(null)
    } else {
      setSuccess(message)
      setError(null)
      setTimeout(() => setSuccess(null), 4000)
    }
  }

  const totalProducts = families.reduce((n, f) => n + f.products.length, 0)

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {families.length} familias · {totalProducts} productos
        </p>
        <button
          type="button"
          onClick={() => setShowNewFamily((v) => !v)}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {showNewFamily ? (
            <X className="size-3.5" aria-hidden="true" />
          ) : (
            <FolderPlus className="size-3.5" aria-hidden="true" />
          )}
          {showNewFamily ? 'Cancelar' : 'Agregar familia'}
        </button>
      </div>

      {showNewFamily && (
        <FamilyForm
          mode="create"
          onNotify={notify}
          onDone={() => setShowNewFamily(false)}
          onCancel={() => setShowNewFamily(false)}
        />
      )}

      {families.map((family) => (
        <FamilyCard
          key={family.id}
          family={family}
          allFamilies={families}
          fichas={fichas}
          onNotify={notify}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Familia
// ---------------------------------------------------------------------------
function FamilyCard({
  family,
  allFamilies,
  fichas,
  onNotify,
}: {
  family: CatalogFamily
  allFamilies: CatalogFamily[]
  fichas: Record<string, FichaInfo>
  onNotify: Notify
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [addingProduct, setAddingProduct] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    if (
      !confirm(
        `¿Eliminar la familia "${family.name}" y sus ${family.products.length} productos? Esta acción no se puede deshacer.`,
      )
    )
      return
    setBusy(true)
    try {
      const res = await deleteFamily(family.id)
      if (!res.ok) return onNotify('error', res.error)
      onNotify('success', `Familia ${family.name} eliminada.`)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-5 py-3">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-lg font-heading text-sm font-bold text-white"
          style={{ backgroundColor: family.color }}
          aria-hidden="true"
        >
          {family.name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-sm font-bold text-foreground">
            Familia {family.name}
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            {family.type ?? 'Sin categoría'} · {family.products.length} productos
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={`Editar familia ${family.name}`}
          title="Editar familia"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:opacity-60"
          aria-label={`Eliminar familia ${family.name}`}
          title="Eliminar familia"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {editing && (
        <div className="border-b border-border p-5">
          <FamilyForm
            mode="edit"
            family={family}
            onNotify={onNotify}
            onDone={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      <ul className="divide-y divide-border">
        {family.products.map((product) =>
          editingProductId === product.id ? (
            <li key={product.id} className="p-5">
              <ProductForm
                mode="edit"
                familyId={family.id}
                allFamilies={allFamilies}
                product={product}
                onNotify={onNotify}
                onDone={() => setEditingProductId(null)}
                onCancel={() => setEditingProductId(null)}
              />
            </li>
          ) : (
            <ProductRow
              key={product.id}
              product={product}
              familyName={family.name}
              ficha={fichas[product.slug] ?? null}
              onEdit={() => setEditingProductId(product.id)}
              onNotify={onNotify}
            />
          ),
        )}
      </ul>

      <div className="border-t border-border p-4">
        {addingProduct ? (
          <ProductForm
            mode="create"
            familyId={family.id}
            allFamilies={allFamilies}
            onNotify={onNotify}
            onDone={() => setAddingProduct(false)}
            onCancel={() => setAddingProduct(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAddingProduct(true)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Agregar producto a {family.name}
          </button>
        )}
      </div>
    </div>
  )
}

function FamilyForm({
  mode,
  family,
  onNotify,
  onDone,
  onCancel,
}: {
  mode: 'create' | 'edit'
  family?: CatalogFamily
  onNotify: Notify
  onDone: () => void
  onCancel: () => void
}) {
  const router = useRouter()
  const [name, setName] = useState(family?.name ?? '')
  const [type, setType] = useState(family?.type ?? '')
  const [description, setDescription] = useState(family?.description ?? '')
  const [color, setColor] = useState(family?.color ?? '#6CC24A')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return onNotify('error', 'El nombre de la familia es obligatorio.')
    setBusy(true)
    try {
      const input = { name, type, description, color }
      const res =
        mode === 'create'
          ? await createFamily(input)
          : await updateFamily(family!.id, input)
      if (!res.ok) return onNotify('error', res.error)
      onNotify('success', mode === 'create' ? `Familia ${name} creada.` : `Familia ${name} actualizada.`)
      onDone()
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-border bg-muted/30 p-4"
    >
      <div className="flex flex-wrap gap-4">
        <label className="flex min-w-[180px] flex-1 flex-col gap-1.5">
          <span className="text-xs font-semibold text-foreground">Nombre de la familia *</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. MICRO+"
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="flex min-w-[180px] flex-1 flex-col gap-1.5">
          <span className="text-xs font-semibold text-foreground">Categoría</span>
          <input
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Ej. Microgranulados"
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-foreground">Color</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-9 w-16 cursor-pointer rounded-lg border border-border bg-background p-1"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-foreground">Descripción</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Descripción breve de la familia."
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
          {mode === 'create' ? 'Crear familia' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Producto
// ---------------------------------------------------------------------------
function ProductRow({
  product,
  familyName,
  ficha,
  onEdit,
  onNotify,
}: {
  product: CatalogFamily['products'][number]
  familyName: string
  ficha: FichaInfo | null
  onEdit: () => void
  onNotify: Notify
}) {
  const router = useRouter()
  const fichaInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'ficha' | 'delete-ficha' | 'delete' | null>(null)

  async function handleFicha(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      onNotify('error', `La ficha de ${product.name} debe ser un PDF.`)
      e.target.value = ''
      return
    }
    setBusy('ficha')
    try {
      const blob = await upload(`fichas/${product.slug}.pdf`, file, {
        access: 'private',
        handleUploadUrl: '/api/assets/upload',
        multipart: true,
      })
      const res = await saveFichaRecord({
        slug: product.slug,
        fileName: file.name,
        filePathname: blob.pathname,
        fileUrl: blob.url,
        fileSize: file.size,
      })
      if (!res.ok) return onNotify('error', res.error)
      onNotify('success', `Ficha de ${product.name} ${ficha ? 'actualizada' : 'cargada'}.`)
      router.refresh()
    } catch (err) {
      console.error('[v0] ficha upload error:', err)
      onNotify('error', `No se pudo subir la ficha de ${product.name}.`)
    } finally {
      setBusy(null)
      if (fichaInputRef.current) fichaInputRef.current.value = ''
    }
  }

  async function handleDeleteFicha() {
    if (!confirm(`¿Eliminar la ficha técnica de ${product.name}?`)) return
    setBusy('delete-ficha')
    try {
      const res = await deleteFicha(product.slug)
      if (!res.ok) return onNotify('error', res.error)
      onNotify('success', `Ficha de ${product.name} eliminada.`)
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  async function handleDeleteProduct() {
    if (!confirm(`¿Eliminar el producto "${product.name}"? Se borrará también su ficha e imagen.`))
      return
    setBusy('delete')
    try {
      const res = await deleteProduct(product.id)
      if (!res.ok) return onNotify('error', res.error)
      onNotify('success', `Producto ${product.name} eliminado.`)
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3">
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-contain p-1"
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: product.color }}
          >
            {familyName.charAt(0)}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: product.color }}
            aria-hidden="true"
          />
          <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
          {product.isNew ? (
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent-foreground">
              Nuevo
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {ficha
            ? `Ficha: ${ficha.fileName ?? 'ficha.pdf'}${ficha.fileSize ? ` · ${formatSize(ficha.fileSize)}` : ''}`
            : 'Sin ficha técnica'}
        </p>
      </div>

      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
          ficha ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
        )}
      >
        {ficha ? (
          <>
            <CheckCircle2 className="size-3" aria-hidden="true" />
            Ficha
          </>
        ) : (
          <>
            <FileText className="size-3" aria-hidden="true" />
            Sin ficha
          </>
        )}
      </span>

      <div className="flex items-center gap-2">
        {ficha ? (
          <a
            href={`/api/fichas/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={`Ver ficha de ${product.name}`}
            title="Ver ficha"
          >
            <Download className="size-4" aria-hidden="true" />
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => fichaInputRef.current?.click()}
          disabled={busy !== null}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 text-xs font-semibold text-secondary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          title={ficha ? 'Reemplazar ficha' : 'Subir ficha'}
        >
          {busy === 'ficha' ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <UploadCloud className="size-3.5" aria-hidden="true" />
          )}
          {ficha ? 'Ficha' : 'Ficha'}
        </button>
        {ficha ? (
          <button
            type="button"
            onClick={handleDeleteFicha}
            disabled={busy !== null}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:opacity-60"
            aria-label={`Eliminar ficha de ${product.name}`}
            title="Eliminar ficha"
          >
            {busy === 'delete-ficha' ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileText className="size-4" aria-hidden="true" />
            )}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={`Editar ${product.name}`}
          title="Editar producto"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={handleDeleteProduct}
          disabled={busy !== null}
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:opacity-60"
          aria-label={`Eliminar ${product.name}`}
          title="Eliminar producto"
        >
          {busy === 'delete' ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <input
        ref={fichaInputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={handleFicha}
      />
    </li>
  )
}

function ProductForm({
  mode,
  familyId,
  allFamilies,
  product,
  onNotify,
  onDone,
  onCancel,
}: {
  mode: 'create' | 'edit'
  familyId: string
  allFamilies: CatalogFamily[]
  product?: CatalogFamily['products'][number]
  onNotify: Notify
  onDone: () => void
  onCancel: () => void
}) {
  const router = useRouter()
  const family = allFamilies.find((f) => f.id === familyId)
  const [name, setName] = useState(product?.name ?? '')
  const [color, setColor] = useState(product?.color ?? family?.color ?? '#6CC24A')
  const [isNew, setIsNew] = useState(product?.isNew ?? false)
  const [targetFamily, setTargetFamily] = useState(familyId)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl ?? null)
  const [fichaFile, setFichaFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      onNotify('error', 'La imagen debe ser PNG, JPG, WEBP o SVG.')
      e.target.value = ''
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function handleFichaPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      onNotify('error', 'La ficha debe ser un PDF.')
      e.target.value = ''
      return
    }
    setFichaFile(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return onNotify('error', 'El nombre del producto es obligatorio.')
    setBusy(true)
    try {
      // 1. Subir imagen mock-up si se eligió una nueva (Blob público).
      let imageUrl: string | null | undefined
      let imagePathname: string | null | undefined
      const imageChanged = !!imageFile
      if (imageFile) {
        const blob = await upload(
          `products/${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`,
          imageFile,
          { access: 'public', handleUploadUrl: '/api/assets/upload', multipart: true },
        )
        imageUrl = blob.url
        imagePathname = blob.pathname
      }

      if (mode === 'create') {
        const res = await createProduct({
          familyId,
          name,
          color,
          isNew,
          imageUrl,
          imagePathname,
        })
        if (!res.ok) return onNotify('error', res.error)

        // 2. Si se cargó ficha, subirla y asociarla al slug recién creado.
        if (fichaFile) {
          const blob = await upload(`fichas/${res.slug}.pdf`, fichaFile, {
            access: 'private',
            handleUploadUrl: '/api/assets/upload',
            multipart: true,
          })
          const fres = await saveFichaRecord({
            slug: res.slug,
            fileName: fichaFile.name,
            filePathname: blob.pathname,
            fileUrl: blob.url,
            fileSize: fichaFile.size,
          })
          if (!fres.ok) onNotify('error', fres.error)
        }
        onNotify('success', `Producto ${name} creado.`)
      } else {
        const res = await updateProduct(product!.id, {
          familyId: targetFamily,
          name,
          color,
          isNew,
          imageUrl,
          imagePathname,
          imageChanged,
        })
        if (!res.ok) return onNotify('error', res.error)
        onNotify('success', `Producto ${name} actualizado.`)
      }
      onDone()
      router.refresh()
    } catch (err) {
      console.error('[v0] product form error:', err)
      onNotify('error', 'No se pudo guardar el producto.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-border bg-muted/30 p-4"
    >
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="relative size-20 overflow-hidden rounded-lg border border-border bg-background">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt="Vista previa"
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                <UploadCloud className="size-6" aria-hidden="true" />
              </span>
            )}
          </div>
          <label className="cursor-pointer text-[11px] font-semibold text-primary hover:underline">
            {imagePreview ? 'Cambiar foto' : 'Subir foto'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="sr-only"
              onChange={handleImagePick}
            />
          </label>
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <label className="flex min-w-[160px] flex-1 flex-col gap-1.5">
              <span className="text-xs font-semibold text-foreground">Nombre del producto *</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Micro+ Zinc"
                className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-foreground">Color</span>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-16 cursor-pointer rounded-lg border border-border bg-background p-1"
              />
            </label>
          </div>

          {mode === 'edit' ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-foreground">Familia</span>
              <select
                value={targetFamily}
                onChange={(e) => setTargetFamily(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              >
                {allFamilies.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {mode === 'create' ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-foreground">
                Ficha técnica (PDF, opcional)
              </span>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFichaPick}
                className="text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-secondary-foreground"
              />
              {fichaFile ? (
                <span className="text-[11px] text-muted-foreground">
                  {fichaFile.name} · {formatSize(fichaFile.size)}
                </span>
              ) : null}
            </label>
          ) : null}

          <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <input
              type="checkbox"
              checked={isNew}
              onChange={(e) => setIsNew(e.target.checked)}
              className="size-4 rounded border-border"
            />
            Marcar como producto nuevo
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
          {mode === 'create' ? 'Crear producto' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
