import Image from 'next/image'
import { Instagram, Facebook, Linkedin, ArrowUpRight } from 'lucide-react'
import { PageHeader } from '@/components/portal/section-heading'

const networks = [
  {
    name: 'Instagram',
    handle: '@amautaagro',
    description: 'Novedades, campañas y el día a día en el campo.',
    href: 'https://www.instagram.com/amautaagro/',
    icon: Instagram,
  },
  {
    name: 'Facebook',
    handle: 'AmautaAgro',
    description: 'Comunidad, eventos y lanzamientos de producto.',
    href: 'https://www.facebook.com/AmautaAgro',
    icon: Facebook,
  },
  {
    name: 'LinkedIn',
    handle: 'Amauta Agro',
    description: 'Mirada institucional, equipo y oportunidades.',
    href: 'https://www.linkedin.com/company/amautaagro',
    icon: Linkedin,
  },
]

export default function RedesPage() {
  return (
    <div>
      <PageHeader
        title="Redes Sociales"
        description="Sumate a la comunidad de Amauta y seguí la conversación en cada red."
      />

      {/* Invitación principal */}
      <section className="relative mb-10 overflow-hidden rounded-3xl border border-border">
        <Image
          src="/images/crop-maiz.png"
          alt="Cultivo de maíz al atardecer"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1d1b16]/92 via-[#1d1b16]/70 to-[#1d1b16]/35" />
        <div className="relative flex flex-col gap-4 p-8 md:p-14">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            Seguinos
          </p>
          <h2 className="max-w-2xl text-balance font-heading text-3xl font-bold leading-tight text-[#fcf9f6] md:text-4xl lg:text-5xl">
            Evolucionando la agricultura, también en redes
          </h2>
          <p className="max-w-xl text-pretty leading-relaxed text-[#fcf9f6]/85">
            Compartimos contenido técnico, campañas y las historias de quienes
            producen con nosotros. Elegí tu red favorita y sumate.
          </p>
        </div>
      </section>

      {/* Tarjetas de redes */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {networks.map((network) => {
          const Icon = network.icon
          return (
            <a
              key={network.name}
              href={network.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <ArrowUpRight
                  className="size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="font-heading text-xl font-bold text-foreground">
                  {network.name}
                </p>
                <p className="text-sm font-medium text-primary">
                  {network.handle}
                </p>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {network.description}
                </p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                Seguir en {network.name}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </span>
            </a>
          )
        })}
      </section>
    </div>
  )
}
