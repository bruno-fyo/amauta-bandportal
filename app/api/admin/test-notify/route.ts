import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { buildAssetNotificationEmail } from '@/lib/emails/asset-notification'

// Diagnóstico TEMPORAL del webhook de notificaciones (solo admin).
// Le pega al webhook de n8n con la clave real de producción y una lista de
// destinatarios VACÍA, así que no envía ningún mail. Nunca devuelve la clave,
// solo su largo y si tiene espacios. Borrar cuando la notificación funcione.
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const url = process.env.N8N_ASSET_NOTIFY_WEBHOOK_URL
  const ownSecret = process.env.N8N_ASSET_NOTIFY_WEBHOOK_SECRET
  const secret = ownSecret ?? process.env.N8N_PASSWORD_RESET_WEBHOOK_SECRET

  const diag: Record<string, unknown> = {
    urlConfigurada: url ?? null,
    claveUsada: ownSecret ? 'N8N_ASSET_NOTIFY_WEBHOOK_SECRET' : secret ? 'N8N_PASSWORD_RESET_WEBHOOK_SECRET' : null,
    largoClave: secret?.length ?? 0,
    claveTieneEspaciosAlBorde: secret ? secret !== secret.trim() : null,
  }

  if (!url || !secret) {
    return NextResponse.json({ ...diag, resultado: 'Falta la URL o la clave.' })
  }

  // ?send=1 → envío REAL de prueba, solo al email del admin logueado, con el
  // mismo payload que manda notifyUsersOfNewAsset.
  const sendReal = new URL(request.url).searchParams.get('send') === '1'
  let payload: Record<string, unknown> = { type: 'diagnostic', recipients: [] }
  if (sendReal) {
    const asset = {
      title: 'Material de prueba',
      description: 'Este es un envío de prueba de la notificación de nuevo material.',
      categoryLabel: 'Prueba',
      fileType: 'PDF',
      url: 'https://recursos.amauta.ag',
    }
    const { subject, html, text } = buildAssetNotificationEmail(asset)
    payload = {
      type: 'asset_uploaded',
      subject,
      html,
      text,
      asset,
      recipients: [{ email: user.email, name: user.name ?? user.email }],
    }
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-amauta-secret': secret },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    })
    const body = (await res.text()).slice(0, 300)
    return NextResponse.json({
      ...diag,
      modo: sendReal ? `envío real a ${user.email}` : 'sin destinatarios (no envía mails)',
      n8nStatus: res.status,
      n8nRespuesta: body,
      resultado:
        sendReal && res.status === 202
          ? 'n8n aceptó el envío. Si el mail no llega en 1-2 minutos, mirá la pestaña Executions del flujo en n8n.'
          : sendReal && res.status === 400
            ? 'n8n rechazó el payload (nodo "Payload válido?").'
          : res.status === 403
          ? 'n8n RECHAZA la clave: el Name/Value de la credencial Header Auth no coincide.'
          : res.status === 404
            ? 'n8n no encuentra el webhook: el flujo no está publicado o la URL no coincide.'
            : 'La clave es ACEPTADA por n8n (la autenticación está bien).',
    })
  } catch (err) {
    return NextResponse.json({
      ...diag,
      resultado: `Error de red al llamar a n8n: ${err instanceof Error ? err.message : String(err)}`,
    })
  }
}
