import 'server-only'

// ---------------------------------------------------------------------------
// Envío de emails transaccionales vía Resend (API REST, sin dependencia extra).
// Variables de entorno necesarias:
//   - RESEND_API_KEY   (obligatoria para enviar en producción)
//   - AUTH_EMAIL_FROM  (remitente verificado, ej. "Amauta <no-reply@amauta.ag>")
// Si faltan: en desarrollo se loguea el código para poder probar; en producción
// se lanza un error (nunca se simula un envío exitoso).
// ---------------------------------------------------------------------------

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

function isProd() {
  return process.env.NODE_ENV === 'production'
}

type SendArgs = { to: string; subject: string; html: string; text: string }

async function sendEmail({ to, subject, html, text }: SendArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.AUTH_EMAIL_FROM

  if (!apiKey || !from) {
    const faltan = [!apiKey && 'RESEND_API_KEY', !from && 'AUTH_EMAIL_FROM']
      .filter(Boolean)
      .join(', ')
    if (isProd()) {
      // No simular envío en producción: fallar de forma explícita (queda en logs
      // del servidor, nunca llega al cliente por el flujo anti-enumeración).
      throw new Error(`No se puede enviar el email: faltan variables ${faltan}.`)
    }
    // Desarrollo: permitir probar el flujo sin proveedor configurado.
    console.log(
      `[v0] Email no enviado (faltan ${faltan}). Contenido para pruebas locales:\n` +
        `  Para: ${to}\n  Asunto: ${subject}\n  ${text.replace(/\n/g, '\n  ')}`,
    )
    return
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Resend respondió ${res.status}: ${detail.slice(0, 300)}`)
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

  await sendEmail({ to, subject, html, text })
}
