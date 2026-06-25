import { Suspense } from 'react'
import { PageHeader, SectionHeading } from '@/components/portal/section-heading'
import { Badge } from '@/components/ui/badge'
import { AmautaWordmark, AmautaIso } from '@/components/brand/logo'
import { AssetExplorer } from '@/components/portal/asset-explorer'
import { AssetGridSkeleton } from '@/components/portal/asset-skeleton'
import { getAssetsForUser } from '@/app/actions/assets'

const palette = [
  { name: 'Tierra Amauta', hex: '#623B2A', pantone: 'Pantone 477C', light: false },
  { name: 'Amauta Oscuro', hex: '#1D1B16', pantone: 'Gradiente', light: false },
  { name: 'Verde Amauta', hex: '#CEDC00', pantone: 'Pantone 381C', light: true },
  { name: 'Blanco Amauta', hex: '#FCF9F6', pantone: 'Base', light: true },
]

export default function IdentidadPage() {
  return (
    <div>
      <PageHeader
        title="Identidad de Marca"
        description="Logotipos, paleta cromática, tipografía y lineamientos oficiales de Amauta."
      />

      {/* Logo showcase */}
      <section className="mb-14 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-10 lg:col-span-2">
          <AmautaWordmark className="h-16 w-auto text-primary" />
          <Badge variant="neutral" size="md">
            Logotipo principal
          </Badge>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-[#241d16] p-10">
          <AmautaIso className="h-20 w-auto text-[#fcf9f6]" />
          <Badge variant="accent" size="md">
            Isotipo
          </Badge>
        </div>
      </section>

      {/* Color palette */}
      <section className="mb-14">
        <SectionHeading
          title="Paleta Cromática"
          description="El color institucional es Tierra Amauta. El Verde Amauta se emplea como acento tecnológico."
        />
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {palette.map((color) => (
            <div
              key={color.name}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div
                className="flex h-32 items-end p-4"
                style={{ backgroundColor: color.hex }}
              >
                <span
                  className="font-mono text-sm font-semibold"
                  style={{ color: color.light ? '#1d1b16' : '#fcf9f6' }}
                >
                  {color.hex}
                </span>
              </div>
              <div className="p-4">
                <p className="font-heading text-base font-bold text-foreground">
                  {color.name}
                </p>
                <p className="text-xs text-muted-foreground">{color.pantone}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="mb-14">
        <SectionHeading
          title="Tipografía"
          description="La familia Titillium se utiliza en todas las comunicaciones institucionales y comerciales."
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Titillium Web · Principal
            </p>
            <p className="mt-4 font-heading text-6xl font-bold text-foreground">
              Aa
            </p>
            <p className="mt-4 text-lg text-foreground">
              ABCDEFGHIJKLMNÑOPQRSTUVWXYZ
            </p>
            <p className="text-lg text-muted-foreground">
              abcdefghijklmnñopqrstuvwxyz 0123456789
            </p>
          </div>
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-primary p-8 text-primary-foreground">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/70">
              Tagline institucional
            </p>
            <div>
              <p className="font-heading text-4xl font-bold leading-tight">
                Evolucionando
              </p>
              <p className="font-heading text-4xl font-light leading-tight">
                la agricultura
              </p>
            </div>
            <p className="text-sm text-primary-foreground/70">
              Bold + Light · interletrado controlado
            </p>
          </div>
        </div>
      </section>

      {/* Downloadable assets */}
      <section>
        <SectionHeading
          title="Recursos descargables"
          description="Logotipos, manuales y archivos oficiales listos para descargar."
        />
        <Suspense fallback={<AssetGridSkeleton />}>
          <IdentidadAssets />
        </Suspense>
      </section>
    </div>
  )
}

async function IdentidadAssets() {
  const assets = await getAssetsForUser('identidad')
  return (
    <AssetExplorer
      assets={assets}
      layout="grid"
      emptyTitle="Todavía no hay archivos de marca cargados"
      emptyDescription="Los logotipos, manuales y archivos oficiales aparecerán aquí cuando se publiquen."
    />
  )
}
