'use client'

import { useEffect, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { AmautaWordmark } from '@/components/brand/logo'
import type { AuthPublicConfig } from '@/lib/b2c'
import { PKCE_STORAGE_KEY, type PkceState } from '@/lib/pkce'

// Retorno del flujo Authorization Code + PKCE (Entra ID).
// Microsoft vuelve con ?code=...&state=... en la query. En el navegador:
//  1) recuperamos verifier/state/nonce de sessionStorage
//  2) canjeamos el code por el id_token en el token endpoint (CORS de SPA)
//  3) enviamos el id_token al servidor para validarlo y crear la sesión
export function CallbackHandler({ config }: { config: AuthPublicConfig }) {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const code = query.get('code')
    const returnedState = query.get('state')
    const oauthError = query.get('error')
    const oauthErrorDesc = query.get('error_description')

    // Recuperar y limpiar el estado PKCE (uso único).
    let saved: PkceState | null = null
    try {
      const raw = sessionStorage.getItem(PKCE_STORAGE_KEY)
      if (raw) saved = JSON.parse(raw) as PkceState
    } catch {
      saved = null
    }
    sessionStorage.removeItem(PKCE_STORAGE_KEY)

    // Quitar el code de la URL de inmediato.
    window.history.replaceState(null, '', window.location.pathname)

    if (oauthError) {
      setError(oauthErrorDesc || 'No se pudo completar el inicio de sesión.')
      return
    }
    if (!code) {
      setError('No se recibió el código de autorización de Microsoft.')
      return
    }
    if (!saved) {
      setError('La sesión de inicio expiró. Volvé a intentar.')
      return
    }
    if (returnedState !== saved.state) {
      setError('Parámetro de seguridad (state) inválido. Volvé a intentar.')
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        // 1) Canje del code por tokens (PKCE, sin secret) — cross-origin SPA.
        const tokenRes = await fetch(config.tokenEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: config.clientId,
            grant_type: 'authorization_code',
            code,
            redirect_uri: config.redirectUri,
            scope: config.scope,
            code_verifier: saved.verifier,
          }),
        })
        const tokenData = (await tokenRes.json()) as {
          id_token?: string
          error_description?: string
        }
        if (cancelled) return
        if (!tokenRes.ok || !tokenData.id_token) {
          setError(
            tokenData.error_description ||
              'No se pudo obtener el token de Microsoft.',
          )
          return
        }

        // 2) Validación server-side + creación de sesión.
        const res = await fetch('/api/auth/b2c/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: tokenData.id_token, nonce: saved.nonce }),
        })
        const data = (await res.json()) as { redirect?: string; error?: string }
        if (cancelled) return
        if (!res.ok) {
          setError(data.error || 'No se pudo iniciar sesión.')
          return
        }
        window.location.replace(data.redirect || '/')
      } catch (err) {
        console.error('[v0] callback error:', err)
        if (!cancelled) setError('Error de red al iniciar sesión. Volvé a intentar.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [config])

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
            href="/login"
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
