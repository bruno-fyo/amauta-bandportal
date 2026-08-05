'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import { AmautaWordmark } from '@/components/brand/logo'

// Página de retorno de Azure AD B2C. Como el flujo usa response_type=id_token,
// el token llega en el fragmento '#'. Lo leemos en el cliente, lo enviamos al
// servidor para su validación, limpiamos el hash y redirigimos al dashboard.
export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const rawHash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash
    const params = new URLSearchParams(rawHash)
    const idToken = params.get('id_token')
    const state = params.get('state')
    const b2cError = params.get('error')
    const errorDescription = params.get('error_description')

    // Eliminar el token del fragmento de la URL de inmediato.
    window.history.replaceState(null, '', window.location.pathname)

    if (b2cError) {
      setError(errorDescription || 'No se pudo completar el inicio de sesión.')
      return
    }
    if (!idToken) {
      setError('No se recibió el token de acceso desde Azure AD B2C.')
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/auth/b2c/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken, state }),
        })
        const data = (await res.json()) as { redirect?: string; error?: string }
        if (cancelled) return
        if (!res.ok) {
          setError(data.error || 'No se pudo iniciar sesión.')
          return
        }
        // Usamos navegación dura para asegurar que el server relea la sesión.
        window.location.replace(data.redirect || '/')
      } catch (err) {
        console.error('[v0] callback error:', err)
        if (!cancelled) setError('Error de red al iniciar sesión. Volvé a intentar.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <AmautaWordmark className="h-8 w-auto text-primary" />
      {error ? (
        <div className="flex max-w-md flex-col items-center gap-4">
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
          <a
            href="/api/auth/b2c/login"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Volver a intentar
          </a>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm">Validando tu acceso…</p>
        </div>
      )}
    </main>
  )
}
