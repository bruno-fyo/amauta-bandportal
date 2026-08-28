'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

// Botón "Ingresar como colaborador Amauta".
// El flujo Authorization Code + PKCE es 100% server-side: este botón solo
// navega a la ruta de inicio (/api/auth/b2c/login), que genera el handshake y
// redirige a Microsoft. No se maneja PKCE ni config de OAuth en el navegador.
export function MicrosoftLoginButton() {
  const [loading, setLoading] = useState(false)

  function handleClick() {
    setLoading(true)
    window.location.assign('/api/auth/b2c/login')
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
