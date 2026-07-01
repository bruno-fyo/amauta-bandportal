'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, LifeBuoy, ShieldCheck } from 'lucide-react'
import { AmautaWordmark } from '@/components/brand/logo'
import { authClient } from '@/lib/auth-client'
import { navItemsForRole } from '@/lib/data'
import type { Role } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname()
  const router = useRouter()
  const items = navItemsForRole(role)

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-6">
        <Link href="/" className="flex items-center gap-3">
          <AmautaWordmark className="h-7 w-auto text-[#fcf9f6]" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          Recursos
        </p>
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                  )}
                >
                  <Icon
                    className={cn(
                      'size-[18px] shrink-0 transition-colors',
                      active
                        ? 'text-sidebar-primary'
                        : 'text-sidebar-foreground/60 group-hover:text-sidebar-primary',
                    )}
                    aria-hidden="true"
                  />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {role === 'admin' && (
          <>
            <p className="px-3 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Administración
            </p>
            <ul className="flex flex-col gap-1">
              <li>
                <Link
                  href="/admin"
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    pathname.startsWith('/admin')
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                  )}
                >
                  <ShieldCheck
                    className={cn(
                      'size-[18px] shrink-0 transition-colors',
                      pathname.startsWith('/admin')
                        ? 'text-sidebar-primary'
                        : 'text-sidebar-foreground/60 group-hover:text-sidebar-primary',
                    )}
                    aria-hidden="true"
                  />
                  Panel de Administración
                </Link>
              </li>
            </ul>
          </>
        )}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 rounded-xl bg-sidebar-accent/50 p-4">
          <p className="text-sm font-semibold text-sidebar-accent-foreground">
            ¿Necesitás ayuda?
          </p>
          <p className="mt-1 text-xs text-sidebar-foreground/70">
            Contactá al equipo de Marketing de Amauta.
          </p>
          <a
            href="mailto:marketing@amauta.ag"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            <LifeBuoy className="size-3.5" aria-hidden="true" />
            Soporte
          </a>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-[18px]" aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
