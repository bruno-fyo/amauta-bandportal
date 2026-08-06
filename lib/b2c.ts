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
// A dónde vuelve Microsoft con el id_token. Debe estar registrado como Redirect
// URI en el App Registration (tipo SPA o Web, con "ID tokens" habilitado).
const REDIRECT_URI =
  process.env.AZURE_B2C_REDIRECT_URI || 'https://recursos.amauta.ag/auth/callback'
const POST_LOGOUT_REDIRECT_URI =
  process.env.AZURE_B2C_POST_LOGOUT_REDIRECT_URI ||
  'https://recursos.amauta.ag/login'

const AUTHORITY = `https://login.microsoftonline.com/${TENANT_ID}`
const SCOPE = 'openid profile email'

// ¿Está configurado el acceso corporativo? (permite degradar con elegancia).
export function b2cConfigured(): boolean {
  return Boolean(TENANT_ID && CLIENT_ID && REDIRECT_URI)
}

// Configuración PÚBLICA (no secreta) que el navegador necesita para iniciar el
// flujo authorization code + PKCE e intercambiar el code por el id_token.
// Se pasa como props desde componentes de servidor a los componentes cliente.
export type AuthPublicConfig = {
  authorizeEndpoint: string
  tokenEndpoint: string
  clientId: string
  redirectUri: string
  scope: string
}

export function getAuthPublicConfig(): AuthPublicConfig {
  return {
    authorizeEndpoint: `${AUTHORITY}/oauth2/v2.0/authorize`,
    tokenEndpoint: `${AUTHORITY}/oauth2/v2.0/token`,
    clientId: CLIENT_ID,
    redirectUri: REDIRECT_URI,
    scope: SCOPE,
  }
}

// URL de cierre de sesión de Entra ID.
export function buildLogoutUrl(): string {
  const params = new URLSearchParams()
  if (POST_LOGOUT_REDIRECT_URI)
    params.set('post_logout_redirect_uri', POST_LOGOUT_REDIRECT_URI)
  return `${AUTHORITY}/oauth2/v2.0/logout?${params.toString()}`
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
