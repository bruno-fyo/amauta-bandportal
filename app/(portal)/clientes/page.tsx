import { PageHeader } from '@/components/portal/section-heading'
import { ClientesReport } from '@/components/admin/clientes-report'
import { DISTRIBUIDORES } from '@/lib/distribuidores'
import { requireAdmin } from '@/lib/session'

export default async function ClientesPage() {
  await requireAdmin()

  return (
    <div>
      <PageHeader
        title="Listado de clientes"
        description="Distribuidores autorizados de Amauta según el uso de marca del contrato de comercialización y objetivos (CyO) vigente."
      />
      <ClientesReport distribuidores={DISTRIBUIDORES} />
    </div>
  )
}
