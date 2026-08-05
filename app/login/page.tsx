import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { b2cConfigured } from '@/lib/b2c'

// Ingreso principal del portal: redirige a Azure AD B2C.
// - Si ya hay sesión activa, va directo al inicio.
// - Si B2C no estuviera configurado, cae al acceso interno (email/contraseña).
export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect('/')

  if (b2cConfigured()) redirect('/api/auth/b2c/login')
  redirect('/acceso-interno')
}
