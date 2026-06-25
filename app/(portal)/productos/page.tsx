import { Suspense } from 'react'
import { PageHeader } from '@/components/portal/section-heading'
import { AssetExplorer } from '@/components/portal/asset-explorer'
import { AssetGridSkeleton } from '@/components/portal/asset-skeleton'
import { getAssetsForUser } from '@/app/actions/assets'

export default function ProductosPage() {
  return (
    <div>
      <PageHeader
        title="Productos"
        description="Biblioteca de fichas técnicas, fotografías y material de cada solución nutricional de Amauta."
      />
      <Suspense fallback={<AssetGridSkeleton />}>
        <ProductosList />
      </Suspense>
    </div>
  )
}

async function ProductosList() {
  const assets = await getAssetsForUser('productos')
  return (
    <AssetExplorer
      assets={assets}
      layout="grid"
      emptyTitle="Todavía no hay productos cargados"
      emptyDescription="El equipo de Marketing publicará aquí las fichas técnicas y el material de cada producto."
    />
  )
}
