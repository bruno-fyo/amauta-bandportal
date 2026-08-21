import type { Metadata } from 'next'
import { PageHeader } from '@/components/portal/section-heading'
import { requireUser } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Términos y Condiciones · Centro de Recursos Amauta',
  description:
    'Términos y condiciones de uso del Centro de Recursos de Amauta Agro S.A.',
}

const SECTIONS = [
  {
    title: '1. Titularidad del material',
    body: 'Todo el material disponible en el Centro de Recursos —incluyendo, sin limitación, logotipos, manuales de marca, fichas de producto, imágenes, videos, campañas y cualquier otra pieza— es propiedad exclusiva de Amauta Agro S.A. y se encuentra protegido por la normativa de propiedad intelectual e industrial vigente.',
  },
  {
    title: '2. Alcance de uso autorizado',
    body: 'El material se pone a disposición exclusivamente para la promoción y comercialización de los productos de Amauta Agro S.A., en el marco de la relación comercial vigente entre las partes. El acceso es personal, intransferible y limitado a los fines aquí descriptos.',
  },
  {
    title: '3. Restricciones',
    body: 'Queda expresamente prohibida la modificación, edición, adaptación, reventa, cesión, licenciamiento o difusión del material fuera del marco de la relación comercial vigente. No podrá utilizarse el material de forma que induzca a error sobre el origen de los productos ni de manera que afecte la imagen o reputación de Amauta Agro S.A.',
  },
  {
    title: '4. Vigencia y revocación',
    body: 'La autorización de uso se mantiene mientras subsista la relación comercial. Amauta Agro S.A. podrá revocar el acceso y el uso del material en cualquier momento, sin necesidad de expresión de causa, cuando finalice dicha relación o ante un uso indebido del material.',
  },
  {
    title: '5. Responsabilidad',
    body: 'El usuario es responsable del uso que realice del material y se compromete a mantener indemne a Amauta Agro S.A. frente a cualquier reclamo derivado de un uso no autorizado o contrario a estos términos.',
  },
  {
    title: '6. Actualizaciones',
    body: 'Amauta Agro S.A. podrá actualizar estos términos y condiciones cuando lo considere necesario. El uso continuado del Centro de Recursos implica la aceptación de la versión vigente al momento del acceso.',
  },
]

export default async function TerminosPage() {
  await requireUser()

  return (
    <div>
      <PageHeader
        title="Términos y Condiciones"
        description="Condiciones de uso del material disponible en el Centro de Recursos de Amauta Agro S.A."
      />

      <div className="max-w-3xl space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="font-heading text-lg font-bold text-foreground">
              {section.title}
            </h2>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
              {section.body}
            </p>
          </section>
        ))}

        <p className="border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground/80">
          Ante cualquier duda sobre el uso del material, comunicate con tu
          contacto comercial en Amauta Agro S.A.
        </p>
      </div>
    </div>
  )
}
