import type { ReactNode } from 'react'
import { Sidebar } from '@/components/portal/sidebar'
import { Header } from '@/components/portal/header'
import { requireUser } from '@/lib/session'

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const user = await requireUser()

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} />
        <main className="flex-1 px-4 py-8 md:px-8 md:py-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
