'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { MicrosoftLoginButton } from '@/components/auth/microsoft-login-button'
import { PasswordRecovery } from '@/components/auth/password-recovery'
import type { AuthPublicConfig } from '@/lib/b2c'

export function LoginForm({
  microsoftConfig = null,
}: {
  microsoftConfig?: AuthPublicConfig | null
}) {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'recover'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Flujo de recuperación de contraseña (solo cuentas locales).
  if (mode === 'recover') {
    return (
      <PasswordRecovery defaultEmail={email} onBackToLogin={() => setMode('login')} />
    )
  }

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
      <div className="mt-10">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Ingresá a tu cuenta
        </h1>
        <p className="mt-2 text-pretty text-muted-foreground">
          Accedé al Centro de Recursos con tu correo y contraseña.
        </p>
      </div>

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
          <div className="mt-1.5 text-right">
            <button
              type="button"
              onClick={() => setMode('recover')}
              className="text-sm font-semibold text-primary transition-opacity hover:opacity-80"
            >
              ¿Olvidaste tu contraseña?
            </button>
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

      {microsoftConfig && (
        <>
          <div className="mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">o</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <MicrosoftLoginButton config={microsoftConfig} />
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
