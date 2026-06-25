import { Suspense } from 'react'
import { PageHeader } from '@/components/portal/section-heading'
import { AssetExplorer } from '@/components/portal/asset-explorer'
import { AssetGridSkeleton } from '@/components/portal/asset-skeleton'
import { getAssetsForUser } from '@/app/actions/assets'

export default function ImagenesPage() {
  return (
    <div>
      <PageHeader
        title="Banco de Imágenes"
        description="Fotografía oficial de cultivos, productos, campos y equipo para tus piezas de comunicación."
      />
      <Suspense fallback={<AssetGridSkeleton />}>
        <ImagenesList />
      </Suspense>
    </div>
  )
}

async function ImagenesList() {
  const assets = await getAssetsForUser('imagenes')
  return (
    <AssetExplorer
      assets={assets}
      layout="masonry"
      emptyTitle="Todavía no hay imágenes cargadas"
      emptyDescription="Las fotografías oficiales aparecerán aquí cuando el equipo de Marketing las publique."
    />
  )
}
