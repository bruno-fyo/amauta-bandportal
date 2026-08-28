import 'server-only'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

// ---------------------------------------------------------------------------
// Configuración centralizada de Azure AD (Entra ID) corporativo.
// El acceso de "colaborador Amauta" usa el tenant corporativo directo
// (login.microsoftonline.com), no B2C. Client ID y Tenant ID no son secretos;
// se pueden sobrescribir por env var, con el valor conocido como respaldo.
// ---------------------------------------------------------------------------
const TENANT_ID =
  process.env.AZURE_TENANT_ID || '9757942a-1dcd-45b3-ba22-2e5bdbc49b3c'
const CLIENT_ID =
  process.env.AZURE_CLIENT_ID || '2aabece9-b306-44e0-abbe-98004bc6ac96'
// A dónde vuelve Microsoft con el code. Debe coincidir EXACTAMENTE con la
// Redirect URI registrada en el App Registration (plataforma SPA). En Azure
// está registrada como /auth/v1/callback, así que fijamos ese path acá y no
// dependemos de la variable de entorno (que tenía el path viejo /auth/callback).
const REDIRECT_URI = 'https://recursos.amauta.ag/auth/v1/callback'

// Client secret — SOLO server-side. Nunca se expone al navegador ni como
// NEXT_PUBLIC_. Habilita el canje confidencial del code (Authorization Code +
// PKCE) contra el token endpoint desde el backend.
const CLIENT_SECRET = process.env.AZURE_B2C_CLIENT_SECRET || ''

const AUTHORITY = `https://login.microsoftonline.com/${TENANT_ID}`
const SCOPE = 'openid profile email'

const AUTHORIZE_ENDPOINT = `${AUTHORITY}/oauth2/v2.0/authorize`
const TOKEN_ENDPOINT = `${AUTHORITY}/oauth2/v2.0/token`

// ¿Está configurado el acceso corporativo? (permite degradar con elegancia).
// Requiere el secret: sin él, el flujo server-side no puede canjear el code, así
// que se oculta el botón en lugar de mostrar un login roto.
export function b2cConfigured(): boolean {
  return Boolean(TENANT_ID && CLIENT_ID && REDIRECT_URI && CLIENT_SECRET)
}

// ---------------------------------------------------------------------------
// Flujo Authorization Code + PKCE, 100% server-side.
// El navegador nunca ve la config de OAuth, ni el code_verifier, ni los tokens
// de Microsoft: solo recibe redirects y, al final, la cookie de sesión propia.
// ---------------------------------------------------------------------------

// Construye la URL de authorize a la que el backend redirige (302) al usuario.
export function buildAuthorizeUrl(p: {
  challenge: string
  state: string
  nonce: string
}): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    response_mode: 'query',
    scope: SCOPE,
    state: p.state,
    nonce: p.nonce,
    code_challenge: p.challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  })
  return `${AUTHORIZE_ENDPOINT}?${params.toString()}`
}

// Canje confidencial del code por el id_token (server-to-server, con secret +
// code_verifier). Requiere que la Redirect URI esté registrada como plataforma
// "Web" en Entra; contra una URI "SPA" Microsoft responde AADSTS9002327.
export async function exchangeCodeForIdToken(p: {
  code: string
  verifier: string
}): Promise<string> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: p.code,
      redirect_uri: REDIRECT_URI,
      scope: SCOPE,
      code_verifier: p.verifier,
    }),
    cache: 'no-store',
  })
  const data = (await res.json()) as {
    id_token?: string
    error?: string
    error_description?: string
  }
  if (!res.ok || !data.id_token) {
    throw new Error(
      data.error_description || data.error || 'No se pudo canjear el code por el token.',
    )
  }
  return data.id_token
}

// ---------------------------------------------------------------------------
// Descubrimiento OIDC: obtenemos issuer y jwks_uri reales del tenant en lugar
// de hardcodearlos (el issuer incluye el GUID del tenant).
// ---------------------------------------------------------------------------
let discoveryCache: { issuer: string; jwksUri: string } | null = null

async function getDiscovery(): Promise<{ issuer: string; jwksUri: string }> {
  if (discoveryCache) return discoveryCache
  const url = `${AUTHORITY}/v2.0/.well-known/openid-configuration`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok)
    throw new Error(`[b2c] No se pudo obtener el discovery document (${res.status})`)
  const json = (await res.json()) as { issuer: string; jwks_uri: string }
  discoveryCache = { issuer: json.issuer, jwksUri: json.jwks_uri }
  return discoveryCache
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

// Valida firma (JWKS), issuer, audience, expiración y nonce del id_token.
export async function verifyIdToken(
  idToken: string,
  expectedNonce: string,
): Promise<JWTPayload> {
  const { issuer, jwksUri } = await getDiscovery()
  if (!jwks) jwks = createRemoteJWKSet(new URL(jwksUri))
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer,
    audience: CLIENT_ID as string,
  })
  if (payload.nonce !== expectedNonce)
    throw new Error('[b2c] nonce inválido: posible replay')
  return payload
}

// ---------------------------------------------------------------------------
// Claims e identidad.
// ---------------------------------------------------------------------------
export type B2CClaims = JWTPayload & {
  oid?: string
  emails?: string[]
  email?: string
  preferred_username?: string
  upn?: string
  name?: string
  given_name?: string
  family_name?: string
  tid?: string
  idp?: string
}

// Extrae identidad estable, email y nombre desde los claims.
// En Entra ID corporativo el email suele venir en `preferred_username` o `upn`.
export function extractIdentity(payload: B2CClaims): {
  b2cId: string
  email: string
  name: string
} {
  const b2cId = String(payload.oid ?? payload.sub ?? '')
  const rawEmail =
    (Array.isArray(payload.emails) ? payload.emails[0] : payload.email) ??
    payload.preferred_username ??
    payload.upn ??
    ''
  const email = rawEmail.toLowerCase()
  const composed = [payload.given_name, payload.family_name]
    .filter(Boolean)
    .join(' ')
  const name = payload.name || composed || email
  return { b2cId, email, name }
}

// Con Entra ID directo, todo el que se autentica lo hace con una cuenta del
// tenant corporativo de Amauta: por lo tanto es colaborador. Los clientes usan
// el formulario propio (email + contraseña), no este flujo.
export function isColaborador(_payload: B2CClaims): boolean {
  return true
}
