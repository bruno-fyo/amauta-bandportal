'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react'
import { createUser } from '@/app/actions/users'
import { ROLES, ROLE_LABELS, type Role } from '@/lib/db/schema'

const ROLE_HINTS: Record<Role, string> = {
  admin: 'Acceso total: carga de materiales y gestión de usuarios.',
  distribuidor: 'Accede al material comercial y de distribución.',
  comercial: 'Accede al material de venta y comunicación.',
}

export function UserCreateForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [role, setRole] = useState<Role>('comercial')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set('role', role)
    const result = await createUser(formData)
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }
    setSuccess('Cuenta creada correctamente.')
    formRef.current?.reset()
    setRole('comercial')
    router.refresh()
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
          className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-foreground"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="new-name" className="mb-1.5 block text-sm font-semibold text-foreground">
            Nombre completo
          </label>
          <input
            id="new-name"
            name="name"
            type="text"
            required
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
            placeholder="Nombre y apellido"
          />
        </div>

        <div>
          <label htmlFor="new-email" className="mb-1.5 block text-sm font-semibold text-foreground">
            Correo electrónico
          </label>
          <input
            id="new-email"
            name="email"
            type="email"
            required
            autoComplete="off"
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
            placeholder="nombre@amauta.ag"
          />
        </div>
      </div>

      <div>
        <label htmlFor="new-password" className="mb-1.5 block text-sm font-semibold text-foreground">
          Contraseña
        </label>
        <input
          id="new-password"
          name="password"
          type="text"
          required
          minLength={8}
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
          placeholder="Mínimo 8 caracteres"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Compartí esta contraseña con el usuario. Podrá usarla para ingresar al portal.
        </p>
      </div>

      <div>
        <span className="mb-2 block text-sm font-semibold text-foreground">Rol asignado</span>
        <div className="grid gap-2 sm:grid-cols-3">
          {ROLES.map((r) => {
            const active = role === r
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                aria-pressed={active}
                className={
                  'flex flex-col gap-1 rounded-xl border p-3 text-left transition-colors ' +
                  (active
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-background hover:border-primary/40')
                }
              >
                <span className="text-sm font-bold text-foreground">{ROLE_LABELS[r]}</span>
                <span className="text-xs leading-snug text-muted-foreground">{ROLE_HINTS[r]}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <>
              <UserPlus className="size-4" aria-hidden="true" />
              Crear cuenta
            </>
          )}
        </button>
      </div>
    </form>
  )
}
