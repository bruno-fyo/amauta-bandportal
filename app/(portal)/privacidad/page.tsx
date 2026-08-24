import type { Metadata } from 'next'
import { PageHeader } from '@/components/portal/section-heading'
import { LegalContent } from '@/components/portal/legal-content'
import { PRIVACY_BLOCKS } from '@/lib/legal-content'
import { requireUser } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Política de Privacidad · Centro de Recursos Amauta',
  description:
    'Política de privacidad de datos personales de Amauta Agro S.A.',
}

export default async function PrivacidadPage() {
  await requireUser()

  return (
    <div>
      <PageHeader
        title="Política de Privacidad"
        description="Tratamiento de datos personales conforme a la Ley N° 25.326."
      />

      <LegalContent blocks={PRIVACY_BLOCKS} />
    </div>
  )
}
