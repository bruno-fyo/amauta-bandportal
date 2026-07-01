import { Suspense } from 'react'
import { PackageOpen } from 'lucide-react'
import { PageHeader, SectionHeading } from '@/components/portal/section-heading'
import { AssetGrid } from '@/components/portal/asset-grid'
import { AssetGridSkeleton } from '@/components/portal/asset-skeleton'
import { requireCategoryAccess } from '@/lib/session'

export default async function KitDistribuidorPage() {
  await requireCategoryAccess('kit-distribuidor')

  return (
    <div>
      <PageHeader
        title="Kit del Distribuidor"
        description="Material exclusivo para distribuidores Amauta: herramientas de venta, condiciones comerciales y recursos para potenciar tu punto de venta."
      />

      {/* Banner */}
      <section className="mb-12 overflow-hidden rounded-3xl border border-border bg-primary text-primary-foreground">
        <div className="flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <PackageOpen className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-2xl font-bold">
                Kit exclusivo para distribuidores
              </h2>
              <p className="mt-1 max-w-lg text-pretty text-sm text-primary-foreground/80">
                Accedé a las piezas, catálogos y materiales pensados para
                acompañar tu red comercial y tu operación diaria.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SectionHeading
        title="Todos los recursos del kit"
        description="Material exclusivo para distribuidores, disponible para descarga inmediata."
      />
      <Suspense fallback={<AssetGridSkeleton />}>
        <AssetGrid
          category="kit-distribuidor"
          emptyHint="Cuando el equipo de Marketing cargue material del kit del distribuidor, vas a verlo acá."
        />
      </Suspense>
    </div>
  )
}
