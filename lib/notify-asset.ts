import 'server-only'

import { inArray, or, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { user, type Role } from '@/lib/db/schema'
import {
  buildAssetNotificationEmail,
  type AssetNotificationData,
} from '@/lib/emails/asset-notification'

// Envío masivo de "nuevo material" vía webhook de n8n (mismo esquema que el
// OTP de recuperación: POST JSON + header x-amauta-secret; n8n envía por Outlook).
//
// Variables de entorno:
//   - N8N_ASSET_NOTIFY_WEBHOOK_URL     (obligatoria)
//   - N8N_ASSET_NOTIFY_WEBHOOK_SECRET  (opcional; si falta se reutiliza
//                                       N8N_PASSWORD_RESET_WEBHOOK_SECRET)
//
// Cada request lleva un lote de destinatarios. n8n debe enviar UN correo por
// destinatario (no poner a todos en el mismo "Para", expondría los emails).

const BATCH_SIZE = 50
const WEBHOOK_TIMEOUT_MS = 15_000

export type NotifyResult =
  | { ok: true; sent: number }
  | { ok: false; sent: number; error: string }

// Destinatarios = todos los usuarios de la base (los que se loguearon alguna
// vez y los creados por el admin) que pueden ver el material: los roles
// marcados en la visibilidad + los admin, que ven todo.
async function getRecipients(visibility: Role[]) {
  const rows = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(
      visibility.length
        ? or(inArray(user.role, visibility), eq(user.role, 'admin'))
        : eq(user.role, 'admin'),
    )

  const seen = new Set<string>()
  return rows.filter((r) => {
    const key = r.email.trim().toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function notifyUsersOfNewAsset(
  asset: AssetNotificationData,
  visibility: Role[],
): Promise<NotifyResult> {
  const url = process.env.N8N_ASSET_NOTIFY_WEBHOOK_URL
  const secret =
    process.env.N8N_ASSET_NOTIFY_WEBHOOK_SECRET ??
    process.env.N8N_PASSWORD_RESET_WEBHOOK_SECRET

  const recipients = await getRecipients(visibility)
  if (recipients.length === 0) return { ok: true, sent: 0 }

  const { subject, html, text } = buildAssetNotificationEmail(asset)

  if (!url || !secret) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[v0] Notificación de material no enviada (falta configurar el webhook). Destinatarios: ${recipients.length}. Asunto: ${subject}`,
      )
    }
    return {
      ok: false,
      sent: 0,
      error: 'El material se cargó, pero falta configurar el webhook de notificaciones (N8N_ASSET_NOTIFY_WEBHOOK_URL).',
    }
  }

  let sent = 0
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS)

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-amauta-secret': secret },
        body: JSON.stringify({
          type: 'asset_uploaded',
          subject,
          html,
          text,
          asset,
          recipients: batch,
        }),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`n8n_error_${res.status}`)
      sent += batch.length
    } catch (err) {
      const code =
        err instanceof Error && err.name === 'AbortError'
          ? 'n8n_timeout'
          : err instanceof Error
            ? err.message
            : 'n8n_network_error'
      console.error(`[v0] Falló la notificación de material (${code}) en el lote ${i / BATCH_SIZE + 1}`)
      return {
        ok: false,
        sent,
        error: `El material se cargó, pero la notificación falló (${sent} de ${recipients.length} enviados).`,
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  return { ok: true, sent }
}
