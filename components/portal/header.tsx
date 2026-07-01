'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Bell, Menu, X, RefreshCw, LogOut } from 'lucide-react'
import { AmautaIso } from '@/components/brand/logo'
import { authClient } from '@/lib/auth-client'
import { navItemsForRole } from '@/lib/data'
import { ROLE_LABELS } from '@/lib/db/schema'
import type { SessionUser } from '@/lib/session'
import { cn } from '@/lib/utils'

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Header({ user }: { user: SessionUser }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 md:h-20 md:px-8">
        {/* Mobile menu + logo */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex size-10 items-center justify-center rounded-lg text-foreground hover:bg-muted lg:hidden"
          aria-label="Abrir menú"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary">
            <AmautaIso className="h-4 w-auto text-primary-foreground" />
          </span>
        </Link>

        {/* Search */}
        <div className="relative ml-auto hidden max-w-md flex-1 md:ml-0 md:block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar recursos, productos, campañas…"
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          {/* Last update */}
          <div className="hidden items-center gap-2 rounded-xl bg-secondary px-3 py-2 xl:flex">
            <RefreshCw className="size-3.5 text-primary" aria-hidden="true" />
            <span className="text-xs font-medium text-secondary-foreground">
              Última actualización: 20 jun 2026
            </span>
          </div>

          {/* Notifications */}
          <button
            type="button"
            className="relative flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-muted"
            aria-label="Notificaciones"
          >
            <Bell className="size-5" />
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-accent ring-2 ring-card" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-xl border border-border bg-card py-1.5 pl-1.5 pr-3 transition-colors hover:bg-muted"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                {getInitials(user.name)}
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-semibold text-foreground">
                  {user.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {ROLE_LABELS[user.role]}
                </span>
              </span>
            </button>

            {profileOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10 cursor-default"
                  aria-hidden="true"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-border bg-card p-1.5 shadow-lg">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div className="my-1 h-px bg-border" />
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="px-4 pb-3 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar recursos…"
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
          />
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen ? (
        <nav className="border-t border-border bg-card px-4 py-3 lg:hidden">
          <ul className="grid grid-cols-2 gap-1.5">
            {navItemsForRole(user.role).map((item) => {
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted',
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
            {user.role === 'admin' && (
              <li className="col-span-2">
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    pathname.startsWith('/admin')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted',
                  )}
                >
                  Panel de Administración
                </Link>
              </li>
            )}
          </ul>
        </nav>
      ) : null}
    </header>
  )
}
