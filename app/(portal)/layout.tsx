import type { ReactNode } from 'react'
import { Sidebar } from '@/components/portal/sidebar'
import { Header } from '@/components/portal/header'
import { requireUser } from '@/lib/session'
import { getLastAssetUpload } from '@/app/actions/assets'

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const user = await requireUser()
  const lastUpload = await getLastAssetUpload()

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} lastUpload={lastUpload ? lastUpload.toISOString() : null} />
        <main className="flex-1 px-4 py-8 md:px-8 md:py-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
        <footer className="px-4 pb-8 md:px-8">
          <div className="mx-auto w-full max-w-7xl border-t border-border pt-6">
            <p className="text-pretty text-xs leading-relaxed text-muted-foreground/80">
              El material disponible en el Centro de Recursos es propiedad de
              Amauta Agro S.A. y se pone a disposición exclusivamente para la
              promoción y comercialización de sus productos, en el marco de la
              relación comercial vigente. Se prohíbe su modificación, edición,
              reventa o difusión fuera de dicho marco.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
