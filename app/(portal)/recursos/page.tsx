import { Suspense } from 'react'
import { Download, Briefcase } from 'lucide-react'
import { PageHeader, SectionHeading } from '@/components/portal/section-heading'
import { AssetGrid } from '@/components/portal/asset-grid'
import { AssetGridSkeleton } from '@/components/portal/asset-skeleton'

export default function RecursosPage() {
  return (
    <div>
      <PageHeader
        title="Recursos Comerciales"
        description="Material de ventas, presentaciones y papelería para tu trabajo diario con clientes y distribuidores."
      />

      {/* Kit banner */}
      <section className="mb-12 overflow-hidden rounded-3xl border border-border bg-primary text-primary-foreground">
        <div className="flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Briefcase className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-2xl font-bold">
                Kit Comercial Completo
              </h2>
              <p className="mt-1 max-w-lg text-pretty text-sm text-primary-foreground/80">
                Descargá las presentaciones, catálogos y piezas listas para usar
                disponibles para tu rol.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SectionHeading
        title="Todos los recursos"
        description="Material comercial disponible para descarga inmediata."
      />
      <Suspense fallback={<AssetGridSkeleton />}>
        <AssetGrid category="recursos" />
      </Suspense>
    </div>
  )
}
