import type { LegalBlock } from '@/lib/legal-content'

// Renderiza el contenido legal (T&C, Política de Privacidad) parseado desde los
// .docx fuente. Los "heading" son subtítulos de sección; el resto, párrafos.
export function LegalContent({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <div className="max-w-3xl space-y-6">
      {blocks.map((block, i) =>
        block.type === 'heading' ? (
          <h2
            key={i}
            className="font-heading text-lg font-bold text-foreground"
          >
            {block.text}
          </h2>
        ) : (
          <p
            key={i}
            className="text-pretty text-sm leading-relaxed text-muted-foreground"
          >
            {block.text}
          </p>
        ),
      )}

      <p className="border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground/80">
        Ante cualquier duda, comunicate con tu contacto comercial en Amauta Agro
        S.A.
      </p>
    </div>
  )
}
