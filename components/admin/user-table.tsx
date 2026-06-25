'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, Trash2 } from 'lucide-react'
import { updateUserRole, deleteUser, type ManagedUser } from '@/app/actions/users'
import { ROLE_LABELS, ROLES, type Role } from '@/lib/db/schema'

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function UserTable({
  users,
  currentUserId,
}: {
  users: ManagedUser[]
  currentUserId: string
}) {
  const router = useRouter()
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(userId: string, role: Role) {
    setError(null)
    setSavingId(userId)
    const result = await updateUserRole(userId, role)
    setSavingId(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  async function handleDelete(u: ManagedUser) {
    if (!window.confirm(`¿Eliminar la cuenta de ${u.name}? Esta acción no se puede deshacer.`))
      return
    setError(null)
    setDeletingId(u.id)
    const result = await deleteUser(u.id)
    setDeletingId(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {error && (
        <div role="alert" className="flex items-center gap-2 border-b border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Usuario</th>
              <th className="px-4 py-3 font-semibold">Correo</th>
              <th className="px-4 py-3 font-semibold">Rol</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                      {getInitials(u.name)}
                    </span>
                    <span className="font-semibold text-foreground">
                      {u.name}
                      {u.id === currentUserId && (
                        <span className="ml-2 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
                          Vos
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={u.role}
                      disabled={u.id === currentUserId || savingId === u.id}
                      onChange={(e) => handleChange(u.id, e.target.value as Role)}
                      className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 disabled:opacity-60"
                      aria-label={`Rol de ${u.name}`}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                    {savingId === u.id && (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id !== currentUserId && (
                    <button
                      type="button"
                      onClick={() => handleDelete(u)}
                      disabled={deletingId === u.id}
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:opacity-60"
                      aria-label={`Eliminar a ${u.name}`}
                    >
                      {deletingId === u.id ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
