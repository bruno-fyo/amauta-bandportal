import { Suspense } from 'react'
import Image from 'next/image'
import { Compass, Download, FileStack, Sparkles } from 'lucide-react'
import { AmautaIso } from '@/components/brand/logo'
import { AssetCard } from '@/components/portal/asset-card'
import { CategoryCard } from '@/components/portal/category-card'
import { SectionHeading } from '@/components/portal/section-heading'
import { AssetGridSkeleton } from '@/components/portal/asset-skeleton'
import { getAssetsForUser, getAssetCounts } from '@/app/actions/assets'
import { CATEGORIES } from '@/lib/categories'
import { Inbox } from 'lucide-react'

async function RecentAssets() {
  const assets = await getAssetsForUser()

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
          <Inbox className="size-6 text-muted-foreground" aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm font-semibold text-foreground">
          Aún no hay recursos cargados
        </p>
        <p className="mt-1 max-w-sm text-pretty text-sm text-muted-foreground">
          El equipo de Marketing irá publicando el material oficial. Volvé pronto
          para encontrar las primeras piezas.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {assets.slice(0, 8).map((asset) => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
    </div>
  )
}

const categoryImages: Record<string, string> = {
  identidad: '/images/soil-hands.png',
  productos: '/images/product-granulado.png',
  recursos: '/images/people-field.png',
  redes: '/images/crop-maiz.png',
  imagenes: '/images/crop-girasol.png',
  videos: '/images/field-aerial.png',
  campanas: '/images/campaign-trigo.png',
}

async function CategoryList() {
  const counts = await getAssetCounts()
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {CATEGORIES.map((c) => (
        <CategoryCard
          key={c.key}
          category={{
            title: c.label,
            href: c.href,
            count: counts[c.key] ?? 0,
            image: categoryImages[c.key] ?? '/placeholder.svg',
          }}
        />
      ))}
    </div>
  )
}

const stats = [
  { label: 'Material oficial', value: 'Centralizado', icon: FileStack },
  { label: 'Categorías', value: '7', icon: Compass },
  { label: 'Siempre actualizado', value: 'Al día', icon: Sparkles },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-14">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border">
        <Image
          src="/images/hero-field.png"
          alt="Campo agrícola productivo al atardecer"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1d1b16]/92 via-[#1d1b16]/70 to-[#1d1b16]/30" />

        <div className="relative flex flex-col gap-8 p-8 md:p-14">
          <div className="max-w-2xl">
            <h1 className="text-balance font-heading text-4xl font-bold leading-[1.05] text-[#fcf9f6] md:text-5xl lg:text-6xl">
              Centro de Recursos Amauta
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg text-[#fcf9f6]/85">
              Todo el material oficial de marca, productos y comunicación en un
              único lugar.
            </p>
          </div>

          <dl className="mt-2 flex flex-wrap gap-8 border-t border-[#fcf9f6]/15 pt-6">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-[#fcf9f6]/10 text-accent">
                  <stat.icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[#fcf9f6]/70">
                    {stat.label}
                  </dt>
                  <dd className="font-heading text-xl font-bold text-[#fcf9f6]">
                    {stat.value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Recently updated */}
      <section>
        <SectionHeading
          title="Actualizados Recientemente"
          description="Las últimas piezas cargadas al centro de recursos, según tu acceso."
          actionLabel="Ver recursos"
          actionHref="/recursos"
        />
        <Suspense fallback={<AssetGridSkeleton count={8} />}>
          <RecentAssets />
        </Suspense>
      </section>

      {/* Categories */}
      <section>
        <SectionHeading
          title="Categorías de Recursos"
          description="Navegá el material organizado por tipo de contenido."
        />
        <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-muted" />}>
          <CategoryList />
        </Suspense>
      </section>
    </div>
  )
}
