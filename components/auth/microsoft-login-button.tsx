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
            viewBox="0 0 687.6 599.05"
            className="size-4"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M201.09,573.15l146.43-361.29,138.98,360.71c68.07,4.78,135.17,13.26,201.11,25.15L462.76,16.4h-133.44c-92.33,0-130.3,83.28-130.3,83.28L0,599.05c65.89-12.19,132.96-20.86,201.09-25.9" />
          </svg>
          Ingresar como colaborador Amauta
        </>
      )}
    </button>
  )
}
