import 'server-only'
import { after } from 'next/server'
import { db } from '@/lib/db'
import { activityLog } from '@/lib/db/schema'

export type ActivityType = 'login' | 'asset_view' | 'asset_download' | 'ficha_download'

export const ACTIVITY_TYPES: ActivityType[] = [
  'login',
  'asset_view',
  'asset_download',
  'ficha_download',
]

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  login: 'Ingreso',
  asset_view: 'Vio material',
  asset_download: 'Descargó material',
  ficha_download: 'Descargó ficha',
}

type Actor = { id: string | null; email: string; name?: string | null; role: string }

type ActivityEvent = {
  type: ActivityType
  assetId?: number | null
  target?: string | null
  detail?: string | null
}

export function requestMeta(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || headers.get('x-real-ip') || null
  return { ipAddress: ip, userAgent: headers.get('user-agent')?.slice(0, 500) ?? null }
}

export async function insertActivity(
  actor: Actor,
  event: ActivityEvent,
  meta: { ipAddress: string | null; userAgent: string | null },
) {
  try {
    await db.insert(activityLog).values({
      userId: actor.id,
      userEmail: actor.email.toLowerCase(),
      userName: actor.name ?? null,
      userRole: actor.role,
      type: event.type,
      assetId: event.assetId ?? null,
      target: event.target ?? null,
      detail: event.detail ?? null,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    })
  } catch (err) {
    // El registro nunca debe romper el ingreso ni la descarga.
    console.error('[activity] no se pudo registrar el evento:', err)
  }
}

// Registra el evento después de enviar la respuesta, para no demorar descargas
// ni redirecciones.
export function logActivity(actor: Actor, event: ActivityEvent, headers: Headers) {
  const meta = requestMeta(headers)
  after(() => insertActivity(actor, event, meta))
}
