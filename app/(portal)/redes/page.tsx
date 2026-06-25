import { Suspense } from 'react'
import { PageHeader } from '@/components/portal/section-heading'
import { AssetExplorer } from '@/components/portal/asset-explorer'
import { AssetGridSkeleton } from '@/components/portal/asset-skeleton'
import { getAssetsForUser } from '@/app/actions/assets'

export default function RedesPage() {
  return (
    <div>
      <PageHeader
        title="Redes Sociales"
        description="Plantillas y placas listas para publicar en cada red, respetando el estilo institucional."
      />
      <Suspense fallback={<AssetGridSkeleton />}>
        <RedesList />
      </Suspense>
    </div>
  )
}

async function RedesList() {
  const assets = await getAssetsForUser('redes')
  return (
    <AssetExplorer
      assets={assets}
      layout="square"
      emptyTitle="Todavía no hay placas cargadas"
      emptyDescription="Las plantillas y placas para redes sociales aparecerán aquí cuando se publiquen."
    />
  )
}
