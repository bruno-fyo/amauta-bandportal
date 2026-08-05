import Link from 'next/link'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { AmautaWordmark } from '@/components/brand/logo'

export const metadata = {
  title: 'Acceso restringido — Centro de Recursos Amauta',
}

export default function AccesoRestringidoPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <AmautaWordmark className="h-8 w-auto text-primary" />
      <div className="flex max-w-md flex-col items-center gap-4">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="size-7" aria-hidden="true" />
        </span>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Acceso restringido
        </h1>
        <p className="text-pretty text-muted-foreground">
          Tu cuenta no tiene permisos para ver esta sección del Centro de
          Recursos. Si creés que es un error, escribí a marketing@amauta.ag.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
