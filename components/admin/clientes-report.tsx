'use client'

import { useMemo, useState } from 'react'
import { Search, CheckCircle2, XCircle } from 'lucide-react'
import type { Distribuidor } from '@/lib/distribuidores'

type Filtro = 'todos' | 'autorizado' | 'no-autorizado'

function normalizar(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function ClientesReport({
  distribuidores,
}: {
  distribuidores: Distribuidor[]
}) {
  const [query, setQuery] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const total = distribuidores.length
  const autorizados = distribuidores.filter((d) => d.autorizado).length
  const noAutorizados = total - autorizados

  const visibles = useMemo(() => {
    const q = normalizar(query.trim())
    return distribuidores.filter((d) => {
      const coincideTexto =
        !q ||
        normalizar(d.nombre).includes(q) ||
        (d.nota ? normalizar(d.nota).includes(q) : false)
      const estado = d.autorizado ? 'autorizado' : 'no-autorizado'
      const coincideFiltro = filtro === 'todos' || estado === filtro
      return coincideTexto && coincideFiltro
    })
  }, [distribuidores, query, filtro])

  const filtros: { key: Filtro; label: string; count: number }[] = [
    { key: 'todos', label: 'Todos', count: total },
    { key: 'autorizado', label: 'Autorizados', count: autorizados },
    { key: 'no-autorizado', label: 'No autorizados', count: noAutorizados },
  ]

  return (
    <div>
      {/* Resumen */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total de distribuidores
          </p>
          <p className="mt-2 font-heading text-3xl font-bold text-foreground">{total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Autorizados (contrato firmado)
          </p>
          <p className="mt-2 font-heading text-3xl font-bold text-emerald-700 dark:text-emerald-400">
            {autorizados}{' '}
            <span className="text-base font-semibold text-emerald-600/70 dark:text-emerald-500/70">
              ({total ? Math.round((autorizados / total) * 100) : 0}%)
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">
            No autorizados (sin contrato)
          </p>
          <p className="mt-2 font-heading text-3xl font-bold text-red-700 dark:text-red-400">
            {noAutorizados}{' '}
            <span className="text-base font-semibold text-red-600/70 dark:text-red-500/70">
              ({total ? Math.round((noAutorizados / total) * 100) : 0}%)
            </span>
          </p>
        </div>
      </div>

      {/* Controles */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar distribuidor…"
            aria-label="Buscar distribuidor"
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
          {filtros.map((f) => {
            const active = filtro === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFiltro(f.key)}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {f.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                    active
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {f.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        Mostrando {visibles.length} de {total} distribuidores
      </p>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="w-12 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                  Distribuidor
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                  Vencimiento de contrato
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                  Renovación automática
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                  Observaciones
                </th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((d) => (
                <tr
                  key={d.id}
                  className="border-t border-border transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3 align-top text-muted-foreground">{d.id}</td>
                  <td className="px-4 py-3 align-top font-semibold text-foreground">
                    {d.nombre}
                  </td>
                  <td className="px-4 py-3 align-top text-foreground/90">
                    {d.fechaVenc || '—'}
                  </td>
                  <td className="px-4 py-3 align-top text-foreground/90">
                    {d.renovacion || '—'}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {d.autorizado ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        Autorizado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                        <XCircle className="size-3.5" aria-hidden="true" />
                        No autorizado
                      </span>
                    )}
                  </td>
                  <td className="max-w-[220px] px-4 py-3 align-top text-xs text-muted-foreground">
                    {d.nota || ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visibles.length === 0 && (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            No se encontraron distribuidores que coincidan con la búsqueda.
          </p>
        )}
      </div>
    </div>
  )
}
