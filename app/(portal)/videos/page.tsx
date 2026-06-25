import { Suspense } from 'react'
import { PageHeader } from '@/components/portal/section-heading'
import { AssetExplorer } from '@/components/portal/asset-explorer'
import { AssetGridSkeleton } from '@/components/portal/asset-skeleton'
import { getAssetsForUser } from '@/app/actions/assets'

export default function VideosPage() {
  return (
    <div>
      <PageHeader
        title="Videos"
        description="Material audiovisual institucional, de producto y de campañas listo para compartir."
      />
      <Suspense fallback={<AssetGridSkeleton />}>
        <VideosList />
      </Suspense>
    </div>
  )
}

async function VideosList() {
  const assets = await getAssetsForUser('videos')
  return (
    <AssetExplorer
      assets={assets}
      layout="grid"
      emptyTitle="Todavía no hay videos cargados"
      emptyDescription="El material audiovisual oficial aparecerá aquí cuando el equipo de Marketing lo publique."
    />
  )
}
