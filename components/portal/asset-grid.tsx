import { Inbox } from 'lucide-react'
import { AssetCard } from '@/components/portal/asset-card'
import { getAssetsForUser } from '@/app/actions/assets'
import type { CategoryKey } from '@/lib/categories'

export async function AssetGrid({
  category,
  emptyHint = 'Cuando el equipo de Marketing cargue recursos en esta sección, vas a verlos acá.',
}: {
  category: CategoryKey
  emptyHint?: string
}) {
  const assets = await getAssetsForUser(category)

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
          <Inbox className="size-6 text-muted-foreground" aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm font-semibold text-foreground">
          Todavía no hay recursos disponibles
        </p>
        <p className="mt-1 max-w-sm text-pretty text-sm text-muted-foreground">
          {emptyHint}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {assets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
    </div>
  )
}
