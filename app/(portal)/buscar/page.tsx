import { SearchX, Search } from 'lucide-react'
import { PageHeader, SectionHeading } from '@/components/portal/section-heading'
import { AssetExplorer } from '@/components/portal/asset-explorer'
import { ProductCatalog } from '@/components/portal/product-catalog'
import { getAssetsForUser } from '@/app/actions/assets'
import { getCatalog, type CatalogFamily } from '@/app/actions/catalog'
import type { Asset } from '@/lib/db/schema'

// Normaliza texto para comparar sin acentos ni mayúsculas.
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

// ¿Alguno de los campos contiene TODOS los términos de la búsqueda?
function matchesAll(terms: string[], fields: (string | null | undefined)[]): boolean {
  const haystack = normalize(fields.filter(Boolean).join(' '))
  return terms.every((t) => haystack.includes(t))
}

function filterAssets(assets: Asset[], terms: string[]): Asset[] {
  return assets.filter((a) =>
    matchesAll(terms, [a.title, a.description, a.category, a.fileType, ...(a.tags ?? [])]),
  )
}

// Filtra productos dentro de cada familia y descarta las familias sin coincidencias.
// Un producto matchea por su nombre o por los datos de su familia (nombre/tipo/descripción).
function filterFamilies(families: CatalogFamily[], terms: string[]): CatalogFamily[] {
  return families
    .map((f) => ({
      ...f,
      products: f.products.filter((p) =>
        matchesAll(terms, [p.name, f.name, f.type, f.description]),
      ),
    }))
    .filter((f) => f.products.length > 0)
}

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const rawQuery = (await searchParams).q ?? ''
  const query = rawQuery.trim()
  const terms = normalize(query).split(/\s+/).filter(Boolean)

  // Sin término de búsqueda: invitación a escribir.
  if (terms.length === 0) {
    return (
      <div>
        <PageHeader
          title="Buscar"
          description="Encontrá materiales descargables y productos del catálogo en un solo lugar."
        />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Search className="size-5" aria-hidden="true" />
          </span>
          <p className="font-heading text-lg font-bold text-foreground">
            Escribí para empezar a buscar
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Usá la barra de arriba para buscar por nombre, descripción, etiqueta o
            categoría entre descargables y productos.
          </p>
        </div>
      </div>
    )
  }

  const [assets, families] = await Promise.all([getAssetsForUser(), getCatalog()])

  const matchedAssets = filterAssets(assets, terms)
  const matchedFamilies = filterFamilies(families, terms)
  const productCount = matchedFamilies.reduce((n, f) => n + f.products.length, 0)
  const totalResults = matchedAssets.length + productCount

  return (
    <div>
      <PageHeader
        title={`Resultados para “${query}”`}
        description={
          totalResults === 0
            ? 'No encontramos coincidencias.'
            : `${totalResults} ${totalResults === 1 ? 'resultado' : 'resultados'}: ${matchedAssets.length} en descargables y ${productCount} en productos.`
        }
      />

      {totalResults === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <SearchX className="size-5" aria-hidden="true" />
          </span>
          <p className="font-heading text-lg font-bold text-foreground">
            Sin coincidencias para “{query}”
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Probá con otro término, revisá la ortografía o usá una palabra más
            general.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {matchedAssets.length > 0 ? (
            <section>
              <SectionHeading
                title="Descargables"
                description={`${matchedAssets.length} ${matchedAssets.length === 1 ? 'material' : 'materiales'} coinciden con tu búsqueda.`}
              />
              <AssetExplorer assets={matchedAssets} showFilters={false} />
            </section>
          ) : null}

          {productCount > 0 ? (
            <section>
              <SectionHeading
                title="Productos"
                description={`${productCount} ${productCount === 1 ? 'producto coincide' : 'productos coinciden'} con tu búsqueda.`}
              />
              <ProductCatalog families={matchedFamilies} />
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}
