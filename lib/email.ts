import 'server-only'

// ---------------------------------------------------------------------------
// Envío del OTP de recuperación de contraseña vía webhook seguro de n8n.
//
// Flujo (100% del lado del servidor):
//   POST JSON a N8N_PASSWORD_RESET_WEBHOOK_URL con header
//   Authorization: Bearer <N8N_PASSWORD_RESET_WEBHOOK_SECRET>.
//   n8n se encarga del envío real del correo. Solo 2xx = éxito.
//
// Variables de entorno:
//   - N8N_PASSWORD_RESET_WEBHOOK_URL     (endpoint del webhook)
//   - N8N_PASSWORD_RESET_WEBHOOK_SECRET  (bearer token compartido)
//
// Seguridad:
//   - Nunca se exponen URL, secreto, OTP ni el email completo al cliente.
//   - En logs de producción no se registran secretos, OTP ni el email completo
//     (se enmascara). El OTP solo se loguea en desarrollo local como fallback.
//   - No se simula un envío exitoso en producción: si faltan variables o n8n
//     falla, se lanza un error (que el llamador captura y convierte en un log
//     genérico, preservando la respuesta anti-enumeración hacia el usuario).
// ---------------------------------------------------------------------------

const WEBHOOK_TIMEOUT_MS = 10_000

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

type WebhookConfig = {
  url: string
  secret: string
}

// Lee y valida la configuración del webhook. Devuelve null si falta alguna
// variable (el llamador decide cómo degradar según el entorno).
function readWebhookConfig(): { config: WebhookConfig | null; missing: string[] } {
  const url = process.env.N8N_PASSWORD_RESET_WEBHOOK_URL
  const secret = process.env.N8N_PASSWORD_RESET_WEBHOOK_SECRET

  const missing = [
    !url && 'N8N_PASSWORD_RESET_WEBHOOK_URL',
    !secret && 'N8N_PASSWORD_RESET_WEBHOOK_SECRET',
  ].filter(Boolean) as string[]

  if (missing.length) return { config: null, missing }
  return { config: { url: url as string, secret: secret as string }, missing: [] }
}

// Envío del código OTP para recuperar la contraseña, vía webhook de n8n.
// Se ejecuta solo en el servidor (import 'server-only').
export async function sendPasswordResetOTP(email: string, otp: string): Promise<void> {
  const { config, missing } = readWebhookConfig()

  if (!config) {
    const faltan = missing.join(', ')
    if (isProd()) {
      // No simular envío en producción: fallar de forma explícita.
      throw new Error(`n8n_config_missing:${faltan}`)
    }
    // Desarrollo: permitir probar el flujo sin webhook configurado.
    // (El OTP solo se muestra en entorno local, nunca en producción.)
    console.log(
      `[v0] OTP no enviado (faltan ${faltan}). Fallback de desarrollo:\n` +
        `  Para: ${maskEmail(email)}\n  Código: ${otp}`,
    )
    return
  }

  // Cuerpo EXACTO que espera n8n. No se agregan campos extra.
  const body = {
    email,
    otp,
    purpose: 'password-reset',
    app: 'amauta-recursos',
  }

  // Timeout de 10s con AbortController.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.secret}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (err) {
    // Distinguir timeout de otros errores de red, sin filtrar URL ni secreto.
    const aborted = err instanceof Error && err.name === 'AbortError'
    logFailure(aborted ? 'n8n_timeout' : 'n8n_network_error', email)
    throw new Error(aborted ? 'n8n_timeout' : 'n8n_network_error')
  } finally {
    clearTimeout(timeout)
  }

  // Solo respuestas 2xx se consideran exitosas.
  if (!res.ok) {
    // No incluir el cuerpo de la respuesta (podría traer datos sensibles).
    logFailure(`n8n_error_${res.status}`, email)
    throw new Error(`n8n_error_${res.status}`)
  }
}

// Log genérico y seguro: nunca incluir OTP, secreto, URL ni el email completo.
function logFailure(code: string, email: string): void {
  console.error(
    `[v0] Falló el envío del OTP de recuperación (${code}) para ${maskEmail(email)}`,
  )
}

// Alias retro-compatible: el resto del código (lib/auth.ts) llama a esta función.
export async function sendPasswordResetEmail(to: string, otp: string): Promise<void> {
  await sendPasswordResetOTP(to, otp)
}
