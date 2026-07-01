import { PageHeader } from '@/components/portal/section-heading'
import { ProductCatalog } from '@/components/portal/product-catalog'
import { PRODUCT_FAMILIES, TOTAL_PRODUCTS } from '@/lib/products'

export default function ProductosPage() {
  return (
    <div>
      <PageHeader
        title="Catálogo de Productos"
        description="Explorá el portfolio completo de Amauta por familia. Desplegá cada familia para ver sus productos y descargar la ficha técnica de cada uno."
      />
      <div className="mb-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
        <span>
          <strong className="font-heading text-lg font-bold text-foreground">
            {PRODUCT_FAMILIES.length}
          </strong>{' '}
          familias
        </span>
        <span>
          <strong className="font-heading text-lg font-bold text-foreground">
            {TOTAL_PRODUCTS}
          </strong>{' '}
          productos
        </span>
      </div>
      <ProductCatalog />
    </div>
  )
}
