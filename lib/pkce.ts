// Helpers de PKCE con Web Crypto API. Se usan server-side (route handlers del
// flujo Authorization Code + PKCE); Web Crypto está disponible en el runtime
// Node de Next. No dependen de next/headers, así que son runtime-agnósticos.

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
