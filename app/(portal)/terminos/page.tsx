import type { Metadata } from 'next'
import { PageHeader } from '@/components/portal/section-heading'
import { LegalContent } from '@/components/portal/legal-content'
import { TERMS_BLOCKS } from '@/lib/legal-content'
import { requireUser } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Términos y Condiciones · Centro de Recursos Amauta',
  description:
    'Términos y condiciones de uso del Centro de Recursos de Amauta Agro S.A.',
}

export default async function TerminosPage() {
  await requireUser()

  return (
    <div>
      <PageHeader
        title="Términos y Condiciones"
        description="Condiciones de uso del Centro de Recursos de Amauta Agro S.A."
      />

      <LegalContent blocks={TERMS_BLOCKS} />
    </div>
  )
}
