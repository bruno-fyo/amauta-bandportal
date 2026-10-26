import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ACTIVITY_LABELS, type ActivityType } from '@/lib/activity'
import { filtersToSearch, PAGE_SIZE, type ActivityFilters } from '@/lib/activity-queries'
import { ROLE_LABELS, type ActivityRow, type Role } from '@/lib/db/schema'
import { describeUserAgent, formatDateTimeAR } from '@/lib/user-agent'

const TYPE_VARIANT: Record<ActivityType, 'neutral' | 'outline' | 'accent' | 'solid'> = {
  login: 'outline',
  asset_view: 'neutral',
  asset_download: 'solid',
  ficha_download: 'accent',
}

export function ActivityTable({
  rows,
  total,
  filters,
}: {
  rows: ActivityRow[]
  total: number
  filters: ActivityFilters
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        No hay eventos para estos filtros.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
              <th scope="col" className="px-4 py-3 font-semibold">Usuario</th>
              <th scope="col" className="px-4 py-3 font-semibold">Evento</th>
              <th scope="col" className="px-4 py-3 font-semibold">Material</th>
              <th scope="col" className="px-4 py-3 font-semibold">Dispositivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                  {formatDateTimeAR(r.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/actividad?${filtersToSearch(filters, { q: r.userEmail, page: 1 })}`}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {r.userName || r.userEmail}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {r.userName ? `${r.userEmail} · ` : ''}
                    {ROLE_LABELS[r.userRole as Role] ?? r.userRole}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={TYPE_VARIANT[r.type as ActivityType] ?? 'outline'}>
                    {ACTIVITY_LABELS[r.type as ActivityType] ?? r.type}
                  </Badge>
                  {r.type === 'login' && r.detail ? (
                    <p className="mt-1 text-xs text-muted-foreground">{r.detail}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {r.type === 'login' ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <>
                      <p className="text-foreground">{r.target ?? '—'}</p>
                      {r.detail ? <p className="text-xs text-muted-foreground">{r.detail}</p> : null}
                    </>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <p>{describeUserAgent(r.userAgent)}</p>
                  {r.ipAddress ? <p className="text-xs tabular-nums">{r.ipAddress}</p> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav aria-label="Paginación" className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          {total.toLocaleString('es-AR')} eventos · página {filters.page} de {pages}
        </p>
        <div className="flex gap-2">
          {filters.page > 1 ? (
            <Link
              href={`/admin/actividad?${filtersToSearch(filters, { page: filters.page - 1 })}`}
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-border px-3 hover:bg-secondary"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Anterior
            </Link>
          ) : null}
          {filters.page < pages ? (
            <Link
              href={`/admin/actividad?${filtersToSearch(filters, { page: filters.page + 1 })}`}
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-border px-3 hover:bg-secondary"
            >
              Siguiente
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </nav>
    </div>
  )
}
