import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Download, Eye, LogIn, Users } from 'lucide-react'
import { PageHeader, SectionHeading } from '@/components/portal/section-heading'
import { CollapsibleSection } from '@/components/admin/collapsible-section'
import { ActivityFiltersForm } from '@/components/admin/activity/activity-filters'
import { ActivityTable } from '@/components/admin/activity/activity-table'
import {
  getActivityEvents,
  getActivitySummary,
  getTopDownloads,
  getUsersWithoutLogin,
  parseActivityFilters,
} from '@/lib/activity-queries'
import { ROLE_LABELS, type Role } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/session'
import { formatDateTimeAR } from '@/lib/user-agent'

export const metadata: Metadata = { title: 'Actividad de usuarios' }

export default async function ActividadPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdmin()
  const filters = parseActivityFilters(await searchParams)

  const [summary, top, events, withoutLogin] = await Promise.all([
    getActivitySummary(filters),
    getTopDownloads(filters),
    getActivityEvents(filters),
    getUsersWithoutLogin(),
  ])

  const stats = [
    { label: 'Usuarios activos', value: summary.activeUsers, icon: Users },
    { label: 'Ingresos', value: summary.logins, icon: LogIn },
    { label: 'Materiales vistos', value: summary.views, icon: Eye },
    { label: 'Descargas', value: summary.downloads, icon: Download },
  ]

  return (
    <div>
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Panel de Administración
      </Link>
      <PageHeader
        title="Actividad de usuarios"
        description="Quién entró al portal, cuándo y qué materiales vio o descargó. El registro arranca con esta versión del portal."
      />

      <div className="mb-8">
        <ActivityFiltersForm filters={filters} />
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {s.value.toLocaleString('es-AR')}
                </p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      <section className="mb-12">
        <SectionHeading
          title="Lo más descargado"
          description="Materiales y fichas técnicas con más descargas en el período elegido."
        />
        {top.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Todavía no hay descargas en este período.
          </div>
        ) : (
          <ol className="divide-y divide-border rounded-2xl border border-border bg-card">
            {top.map((t, i) => (
              <li key={`${t.type}-${t.target}-${t.detail}`} className="flex items-center gap-4 px-5 py-3">
                <span className="w-6 text-right text-sm font-semibold tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{t.target ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.type === 'ficha_download' ? 'Ficha técnica' : 'Material'}
                    {t.detail ? ` · ${t.detail}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums text-foreground">{t.total}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.users} {t.users === 1 ? 'usuario' : 'usuarios'}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mb-12">
        <SectionHeading
          title="Registro de actividad"
          description="Tocá un usuario para ver solo su actividad."
        />
        <ActivityTable rows={events.rows} total={events.total} filters={filters} />
      </section>

      <CollapsibleSection
        title="Usuarios que nunca entraron"
        description="Cuentas de colaboradores y distribuidores sin ningún ingreso registrado. Útil para hacer seguimiento."
        count={withoutLogin.length}
      >
        {withoutLogin.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todos los usuarios entraron al menos una vez.</p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {withoutLogin.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {ROLE_LABELS[u.role as Role] ?? u.role} · alta {formatDateTimeAR(u.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>
    </div>
  )
}
