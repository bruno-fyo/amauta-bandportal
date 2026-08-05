import 'server-only'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

// ---------------------------------------------------------------------------
// Configuración centralizada de Azure AD B2C.
// Toda la integración usa estas variables de entorno. No repetir URLs sueltas.
// ---------------------------------------------------------------------------
const LOGIN_DOMAIN = process.env.AZURE_B2C_LOGIN_DOMAIN
const TENANT_DOMAIN = process.env.AZURE_B2C_TENANT_DOMAIN
const POLICY = process.env.AZURE_B2C_POLICY
const CLIENT_ID = process.env.AZURE_B2C_CLIENT_ID
const REDIRECT_URI = process.env.AZURE_B2C_REDIRECT_URI
const POST_LOGOUT_REDIRECT_URI = process.env.AZURE_B2C_POST_LOGOUT_REDIRECT_URI

// ¿Está configurada la integración B2C? (permite degradar con elegancia).
export function b2cConfigured(): boolean {
  return Boolean(LOGIN_DOMAIN && TENANT_DOMAIN && POLICY && CLIENT_ID && REDIRECT_URI)
}

function base(): string {
  return `https://${LOGIN_DOMAIN}/${TENANT_DOMAIN}`
}

// URL de autorización (login) de B2C. Flujo implícito: response_type=id_token.
// El id_token vuelve en el fragmento '#' hacia REDIRECT_URI (/auth/callback).
export function buildAuthorizeUrl(opts: { nonce: string; state: string }): string {
  const params = new URLSearchParams({
    p: POLICY as string,
    client_id: CLIENT_ID as string,
    nonce: opts.nonce,
    state: opts.state,
    redirect_uri: REDIRECT_URI as string,
    scope: 'openid',
    response_type: 'id_token',
    prompt: 'login',
  })
  return `${base()}/oauth2/v2.0/authorize?${params.toString()}`
}

// URL de cierre de sesión de B2C.
export function buildLogoutUrl(): string {
  const params = new URLSearchParams({ p: POLICY as string })
  if (POST_LOGOUT_REDIRECT_URI)
    params.set('post_logout_redirect_uri', POST_LOGOUT_REDIRECT_URI)
  return `${base()}/oauth2/v2.0/logout?${params.toString()}`
}

// ---------------------------------------------------------------------------
// Descubrimiento OIDC: obtenemos issuer y jwks_uri reales del tenant/política
// en lugar de hardcodearlos (el issuer incluye el GUID del tenant).
// ---------------------------------------------------------------------------
let discoveryCache: { issuer: string; jwksUri: string } | null = null

async function getDiscovery(): Promise<{ issuer: string; jwksUri: string }> {
  if (discoveryCache) return discoveryCache
  const url = `${base()}/v2.0/.well-known/openid-configuration?p=${POLICY}`
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
  name?: string
  given_name?: string
  family_name?: string
  idp?: string
  tfp?: string
  acr?: string
}

// Extrae identidad estable, email y nombre desde los claims.
export function extractIdentity(payload: B2CClaims): {
  b2cId: string
  email: string
  name: string
} {
  const b2cId = String(payload.oid ?? payload.sub ?? '')
  const rawEmail =
    (Array.isArray(payload.emails) ? payload.emails[0] : payload.email) ?? ''
  const email = rawEmail.toLowerCase()
  const composed = [payload.given_name, payload.family_name]
    .filter(Boolean)
    .join(' ')
  const name = payload.name || composed || email
  return { b2cId, email, name }
}

// Regla centralizada y ajustable para reconocer colaboradores de Amauta.
// Por defecto: si el token trae un claim `idp` (proveedor federado / acceso
// corporativo), es colaborador. Las cuentas locales de clientes (email +
// contraseña) NO incluyen `idp`. Se puede fijar el valor exacto esperado con
// la variable AZURE_B2C_COLABORADOR_IDP una vez confirmado con el primer login.
export function isColaborador(payload: B2CClaims): boolean {
  const expectedIdp = process.env.AZURE_B2C_COLABORADOR_IDP
  const idp = typeof payload.idp === 'string' ? payload.idp : undefined
  if (expectedIdp) return idp === expectedIdp
  return Boolean(idp)
}
