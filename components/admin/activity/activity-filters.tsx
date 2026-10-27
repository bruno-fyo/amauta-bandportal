import Link from 'next/link'
import { Download, Search } from 'lucide-react'
import { ACTIVITY_LABELS, ACTIVITY_TYPES } from '@/lib/activity'
import { filtersToSearch, type ActivityFilters } from '@/lib/activity-queries'
import { ROLES, ROLE_LABELS } from '@/lib/db/schema'

const fieldClass =
  'h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function ActivityFiltersForm({ filters }: { filters: ActivityFilters }) {
  return (
    <form
      method="get"
      action="/admin/actividad"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          Desde
          <input type="date" name="from" defaultValue={filters.from} className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          Hasta
          <input type="date" name="to" defaultValue={filters.to} className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          Rol
          <select name="role" defaultValue={filters.role} className={fieldClass}>
            <option value="">Todos</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          Actividad
          <select name="type" defaultValue={filters.type} className={fieldClass}>
            <option value="">Todos</option>
            <option value="descargas">Todas las descargas</option>
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {ACTIVITY_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          Usuario
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="Nombre o email"
            className={fieldClass}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href="/admin/actividad"
          className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Limpiar
        </Link>
        <a
          href={`/api/admin/actividad/export?${filtersToSearch(filters, { page: 1 })}`}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-foreground hover:bg-secondary"
        >
          <Download className="size-4" aria-hidden="true" />
          Exportar a Excel
        </a>
        <button
          type="submit"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Search className="size-4" aria-hidden="true" />
          Aplicar filtros
        </button>
      </div>
    </form>
  )
}
