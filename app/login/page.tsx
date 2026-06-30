import Image from 'next/image'
import { redirect } from 'next/navigation'
import { AmautaWordmark, AmautaIso } from '@/components/brand/logo'
import { LoginForm } from '@/components/auth/login-form'
import { getCurrentUser } from '@/lib/session'

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect('/')

  return (
    <main className="flex min-h-dvh bg-background">
      {/* Form side */}
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-12 lg:w-[46%] lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <AmautaWordmark className="h-8 w-auto text-primary" />

          <div className="mt-12">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Centro de Recursos
            </h1>
            <p className="mt-2 text-pretty text-muted-foreground">
              Ingresá con tu cuenta para acceder al material oficial de marca,
              productos y comunicación.
            </p>
          </div>

          <LoginForm />
        </div>
      </div>

      {/* Image side */}
      <div className="relative hidden lg:block lg:w-[54%]">
        <Image
          src="/images/login-field.png"
          alt="Campo agrícola de Amauta al amanecer"
          fill
          priority
          sizes="54vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1d1b16]/90 via-[#1d1b16]/35 to-[#1d1b16]/20" />

        <div className="absolute inset-0 flex flex-col justify-between p-14">
          <div className="max-w-lg">
            <p className="font-heading text-4xl font-bold leading-tight text-[#fcf9f6]">
              Evolucionando
              <span className="block font-light">la agricultura</span>
            </p>
            <p className="mt-4 text-pretty text-[#fcf9f6]/80">
              Potenciamos los rindes a través de la nutrición vegetal, cuidando
              la salud del suelo.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
