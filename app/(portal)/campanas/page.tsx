import { Suspense } from 'react'
import { PageHeader } from '@/components/portal/section-heading'
import { AssetExplorer } from '@/components/portal/asset-explorer'
import { AssetGridSkeleton } from '@/components/portal/asset-skeleton'
import { getAssetsForUser } from '@/app/actions/assets'

export default function CampanasPage() {
  return (
    <div>
      <PageHeader
        title="Campañas"
        description="Accedé a todas las piezas, plantillas y recursos de cada campaña de comunicación de Amauta."
      />
      <Suspense fallback={<AssetGridSkeleton />}>
        <CampanasList />
      </Suspense>
    </div>
  )
}

async function CampanasList() {
  const assets = await getAssetsForUser('campanas')
  return (
    <AssetExplorer
      assets={assets}
      layout="grid"
      emptyTitle="Todavía no hay campañas cargadas"
      emptyDescription="Las piezas y recursos de cada campaña aparecerán aquí cuando se publiquen."
    />
  )
}
