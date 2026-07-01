import { PageHeader } from '@/components/portal/section-heading'
import { ProductCatalog } from '@/components/portal/product-catalog'
import { getCatalog } from '@/app/actions/catalog'

export default async function ProductosPage() {
  const families = await getCatalog()
  const totalProducts = families.reduce((n, f) => n + f.products.length, 0)

  return (
    <div>
      <PageHeader
        title="Productos"
        description="Explorá el portfolio completo de Amauta por familia. Desplegá cada familia para ver sus productos y descargar la ficha técnica de cada uno."
      />
      <div className="mb-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
        <span>
          <strong className="font-heading text-lg font-bold text-foreground">
            {families.length}
          </strong>{' '}
          familias
        </span>
        <span>
          <strong className="font-heading text-lg font-bold text-foreground">
            {totalProducts}
          </strong>{' '}
          productos
        </span>
      </div>
      {families.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          Todavía no hay productos cargados. El administrador puede agregarlos desde el
          panel.
        </p>
      ) : (
        <ProductCatalog families={families} />
      )}
    </div>
  )
}
