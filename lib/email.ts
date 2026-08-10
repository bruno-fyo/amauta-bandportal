import 'server-only'

// ---------------------------------------------------------------------------
// Envío de emails transaccionales vía Microsoft Graph (Microsoft 365).
//
// Flujo (100% del lado del servidor):
//   1. OAuth 2.0 Client Credentials contra el tenant corporativo de M365 para
//      obtener un access token (scope https://graph.microsoft.com/.default).
//   2. POST /users/{senderMailbox}/sendMail  ->  202 Accepted = enviado.
//
// Variables de entorno (tenant CORPORATIVO de Microsoft 365, NO el de B2C):
//   - MICROSOFT_GRAPH_TENANT_ID
//   - MICROSOFT_GRAPH_CLIENT_ID
//   - MICROSOFT_GRAPH_CLIENT_SECRET
//   - MICROSOFT_GRAPH_SENDER_EMAIL   (casilla remitente, ej. no-reply@amauta.ag)
//
// Seguridad:
//   - Nunca se exponen tenant/client/secret/token/OTP al cliente.
//   - En logs de producción no se registran secretos, tokens, OTP ni el email
//     completo (se enmascara). El OTP solo se loguea en desarrollo local.
//   - No se simula un envío exitoso en producción: si faltan variables o Graph
//     falla, se lanza un error (que el llamador captura y convierte en un log
//     genérico, preservando la respuesta anti-enumeración hacia el usuario).
// ---------------------------------------------------------------------------

function isProd() {
  return process.env.NODE_ENV === 'production'
}

// Enmascara un email para logs: "marketing@amauta.ag" -> "m***@amauta.ag".
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  const head = local.slice(0, 1)
  return `${head}***@${domain}`
}

type GraphConfig = {
  tenantId: string
  clientId: string
  clientSecret: string
  sender: string
}

// Lee y valida la configuración de Graph. Devuelve null si falta alguna
// variable (el llamador decide cómo degradar según el entorno).
function readGraphConfig(): { config: GraphConfig | null; missing: string[] } {
  const tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID
  const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET
  const sender = process.env.MICROSOFT_GRAPH_SENDER_EMAIL

  const missing = [
    !tenantId && 'MICROSOFT_GRAPH_TENANT_ID',
    !clientId && 'MICROSOFT_GRAPH_CLIENT_ID',
    !clientSecret && 'MICROSOFT_GRAPH_CLIENT_SECRET',
    !sender && 'MICROSOFT_GRAPH_SENDER_EMAIL',
  ].filter(Boolean) as string[]

  if (missing.length) return { config: null, missing }
  return {
    config: {
      tenantId: tenantId as string,
      clientId: clientId as string,
      clientSecret: clientSecret as string,
      sender: sender as string,
    },
    missing: [],
  }
}

// -------------------------- Caché de token en memoria -----------------------
// Se reutiliza el access token mientras siga vigente. No se persiste en base de
// datos ni fuera del proceso. En serverless puede recrearse por invocación, lo
// cual es seguro (solo implica pedir un token nuevo a Graph).
let tokenCache: { token: string; expiresAt: number } | null = null

// Solo para pruebas: limpia el token cacheado. No expone ningún secreto.
export function resetGraphTokenCache(): void {
  tokenCache = null
}

async function getAccessToken(config: GraphConfig): Promise<string> {
  const now = Date.now()
  // Margen de 60s para no usar un token a punto de expirar.
  if (tokenCache && tokenCache.expiresAt - 60_000 > now) {
    return tokenCache.token
  }

  const url = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  })

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
  } catch {
    // No incluir detalles de red que pudieran filtrar configuración.
    throw new Error('graph_token_network_error')
  }

  if (!res.ok) {
    // El cuerpo puede contener client_id/descripciones: NO lo incluimos en el
    // error propagado. Solo el status, que es seguro.
    throw new Error(`graph_token_error_${res.status}`)
  }

  const json = (await res.json().catch(() => null)) as
    | { access_token?: string; expires_in?: number }
    | null

  if (!json?.access_token) {
    throw new Error('graph_token_missing_access_token')
  }

  const expiresInMs = (json.expires_in ?? 3600) * 1000
  tokenCache = { token: json.access_token, expiresAt: now + expiresInMs }
  return json.access_token
}

type SendArgs = { to: string; subject: string; html: string; text: string }

async function sendEmail({ to, subject, html, text }: SendArgs): Promise<void> {
  const { config, missing } = readGraphConfig()

  if (!config) {
    const faltan = missing.join(', ')
    if (isProd()) {
      // No simular envío en producción: fallar de forma explícita.
      throw new Error(`graph_config_missing:${faltan}`)
    }
    // Desarrollo: permitir probar el flujo sin credenciales configuradas.
    // (El OTP va dentro de `text`; esto solo ocurre en entorno local.)
    console.log(
      `[v0] Email no enviado (faltan ${faltan}). Contenido para pruebas locales:\n` +
        `  Para: ${to}\n  Asunto: ${subject}\n  ${text.replace(/\n/g, '\n  ')}`,
    )
    return
  }

  const token = await getAccessToken(config)

  const endpoint = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
    config.sender,
  )}/sendMail`

  const payload = {
    message: {
      subject,
      body: { contentType: 'HTML', content: html },
      toRecipients: [{ emailAddress: { address: to } }],
    },
    saveToSentItems: false,
  }

  let res: Response
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('graph_sendmail_network_error')
  }

  // Graph responde 202 Accepted cuando el mensaje se encoló correctamente.
  if (res.status !== 202) {
    // No incluir el cuerpo (podría traer datos de la casilla o del destinatario).
    throw new Error(`graph_sendmail_error_${res.status}`)
  }
}

// Email con el código OTP para recuperar la contraseña.
export async function sendPasswordResetEmail(to: string, otp: string): Promise<void> {
  const subject = 'Código para recuperar tu contraseña | Amauta'
  const text =
    'Recibimos una solicitud para restablecer la contraseña de tu cuenta en el ' +
    'Centro de Recursos Amauta.\n\n' +
    `Tu código de verificación es:\n\n${otp}\n\n` +
    'Este código vence en 10 minutos.\n\n' +
    'Si no solicitaste este cambio, podés ignorar este mensaje. Tu contraseña ' +
    'continuará siendo la misma.'

  const html = `
  <div style="background:#f4f1ea;padding:32px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e7e1d6;">
      <div style="padding:28px 32px 8px;">
        <div style="font-size:20px;font-weight:800;letter-spacing:-0.02em;color:#3a7d3c;">AMAUTA</div>
      </div>
      <div style="padding:8px 32px 28px;color:#33312c;">
        <h1 style="font-size:20px;margin:16px 0 8px;color:#1d1b16;">Recuperar contraseña</h1>
        <p style="font-size:14px;line-height:1.6;margin:0 0 20px;color:#57534b;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta en el
          Centro de Recursos Amauta. Tu código de verificación es:
        </p>
        <div style="text-align:center;margin:24px 0;">
          <span style="display:inline-block;font-size:32px;font-weight:800;letter-spacing:10px;color:#1d1b16;background:#f4f1ea;border-radius:12px;padding:16px 24px;">${otp}</span>
        </div>
        <p style="font-size:13px;line-height:1.6;margin:0 0 8px;color:#57534b;">
          Este código vence en <strong>10 minutos</strong>.
        </p>
        <p style="font-size:13px;line-height:1.6;margin:0;color:#8a857b;">
          Si no solicitaste este cambio, podés ignorar este mensaje. Tu contraseña
          continuará siendo la misma.
        </p>
      </div>
    </div>
  </div>`

  try {
    await sendEmail({ to, subject, html, text })
  } catch (err) {
    // Log genérico y seguro: nunca incluir OTP, token, secretos ni el email
    // completo. Se relanza para que el llamador decida (manteniendo la
    // respuesta anti-enumeración hacia el usuario final).
    const code = err instanceof Error ? err.message.split(':')[0] : 'graph_unknown_error'
    console.error(
      `[v0] Falló el envío del email de recuperación (${code}) para ${maskEmail(to)}`,
    )
    throw err
  }
}
