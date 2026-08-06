'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { AuthPublicConfig } from '@/lib/b2c'
import {
  createPkcePair,
  randomUrlSafe,
  PKCE_STORAGE_KEY,
} from '@/lib/pkce'

// Botón "Ingresar como colaborador Amauta".
// Inicia el flujo Authorization Code + PKCE (estilo SPA): genera el par
// verifier/challenge, guarda verifier+state+nonce en sessionStorage y redirige
// a la pantalla de login corporativo de Microsoft (Entra ID).
export function MicrosoftLoginButton({ config }: { config: AuthPublicConfig }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const { verifier, challenge } = await createPkcePair()
      const state = randomUrlSafe(32)
      const nonce = randomUrlSafe(32)

      // Persistimos lo necesario para validar el retorno (mismo origen).
      sessionStorage.setItem(
        PKCE_STORAGE_KEY,
        JSON.stringify({ verifier, state, nonce }),
      )

      const params = new URLSearchParams({
        client_id: config.clientId,
        response_type: 'code',
        redirect_uri: config.redirectUri,
        response_mode: 'query',
        scope: config.scope,
        state,
        nonce,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        prompt: 'select_account',
      })

      window.location.assign(`${config.authorizeEndpoint}?${params.toString()}`)
    } catch (err) {
      console.error('[v0] pkce init error:', err)
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <>
          <svg
            viewBox="0 0 155 173.19"
            className="size-4"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M59.83,101.61l25.04-61.77,23.76,61.67c11.65.82,23.12,2.27,34.39,4.3L104.57,6.41h-22.82c-15.78,0-22.28,14.24-22.28,14.24L25.45,106.03c11.26-2.08,22.74-3.57,34.38-4.43" />
            <path d="M147.35,117.04c-3.77-.76-7.6-1.34-11.42-1.94v-.1c-1.18-.2-2.38-.33-3.56-.51-1.42-.2-2.85-.43-4.29-.61-14.13-1.94-28.54-3.05-43.21-3.05-9.9,0-19.69.53-29.36,1.44v-.02c-.34.04-.67.09-1.03.13-4.6.43-9.17.98-13.73,1.62-1.42.2-2.86.37-4.27.59-.57.09-1.13.15-1.71.24v.05c-4.63.74-9.24,1.49-13.8,2.42L0,169.87h34.13l12.74-32.68c12.44-1.62,25.11-2.53,37.99-2.53s24.35.85,36.23,2.33l.06.2,7.07,18.49s5.92,14.19,19.97,14.19h19.61l-20.45-52.83Z" />
          </svg>
          Ingresar como colaborador Amauta
        </>
      )}
    </button>
  )
}
