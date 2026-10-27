import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { ACTIVITY_LABELS, type ActivityType } from '@/lib/activity'
import { getAllActivityEvents, parseActivityFilters } from '@/lib/activity-queries'
import { ROLE_LABELS, type Role } from '@/lib/db/schema'
import { describeUserAgent, formatDateTimeAR } from '@/lib/user-agent'

function csvCell(value: unknown) {
  const s = value == null ? '' : String(value)
  // Evita que Excel interprete el contenido como fórmula.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return `"${safe.replace(/"/g, '""')}"`
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const filters = parseActivityFilters(Object.fromEntries(request.nextUrl.searchParams))
  const rows = await getAllActivityEvents(filters)

  const header = ['Fecha', 'Nombre', 'Email', 'Rol', 'Actividad', 'Material', 'Detalle', 'Dispositivo', 'IP']
  const lines = rows.map((r) =>
    [
      formatDateTimeAR(r.createdAt),
      r.userName,
      r.userEmail,
      ROLE_LABELS[r.userRole as Role] ?? r.userRole,
      ACTIVITY_LABELS[r.type as ActivityType] ?? r.type,
      r.target,
      r.detail,
      describeUserAgent(r.userAgent),
      r.ipAddress,
    ]
      .map(csvCell)
      .join(';'),
  )

  const body = `\uFEFF${[header.map(csvCell).join(';'), ...lines].join('\r\n')}`
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="actividad-${filters.from}-a-${filters.to}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
