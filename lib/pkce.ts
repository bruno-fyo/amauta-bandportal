// Helpers de PKCE para el navegador (Web Crypto API). Sin 'server-only':
// se usan en componentes cliente (botón de login y página de callback).

export const PKCE_STORAGE_KEY = 'amauta_pkce'

export type PkceState = {
  verifier: string
  state: string
  nonce: string
}

// Cadena aleatoria URL-safe (sin padding) a partir de bytes seguros.
export function randomUrlSafe(bytes = 32): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return base64UrlEncode(arr.buffer)
}

// Genera el par PKCE: verifier (aleatorio) y challenge = BASE64URL(SHA256(verifier)).
export async function createPkcePair(): Promise<{
  verifier: string
  challenge: string
}> {
  const verifier = randomUrlSafe(48)
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const challenge = base64UrlEncode(digest)
  return { verifier, challenge }
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
