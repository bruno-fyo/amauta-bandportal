'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

export function LoginForm({ showMicrosoft = false }: { showMicrosoft?: boolean }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await authClient.signIn.email({ email, password })
      if (error) {
        setError(traducirError(error.message))
        setLoading(false)
        return
      }
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('[v0] auth error:', err)
      setError('Ocurrió un error inesperado. Intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div
          role="alert"
          className="mt-8 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-foreground">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
              placeholder="nombre@amauta.ag"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-foreground">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
              placeholder="Tu contraseña"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <>
              Ingresar 
              <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      {showMicrosoft && (
        <>
          <div className="mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">o</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <a
            href="/api/auth/b2c/login"
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <svg viewBox="0 0 21 21" className="size-4" aria-hidden="true">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            Ingresar como colaborador Amauta
          </a>
        </>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground text-pretty">
        El acceso es exclusivo para el equipo y la red de Amauta. Si necesitás una cuenta, solicitala
        a marketing@amauta.ag
      </p>
    </div>
  )
}

function traducirError(message?: string): string {
  if (!message) return 'No pudimos procesar tu solicitud.'
  const m = message.toLowerCase()
  if (m.includes('invalid') && m.includes('password'))
    return 'Correo o contraseña incorrectos.'
  if (m.includes('invalid email')) return 'El correo electrónico no es válido.'
  if (m.includes('credential')) return 'Correo o contraseña incorrectos.'
  if (m.includes('password')) return 'Correo o contraseña incorrectos.'
  return 'No pudimos procesar tu solicitud. Verificá los datos e intentá de nuevo.'
}
