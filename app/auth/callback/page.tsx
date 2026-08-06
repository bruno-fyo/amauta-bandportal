import { getAuthPublicConfig } from '@/lib/b2c'
import { CallbackHandler } from '@/components/auth/callback-handler'

export const dynamic = 'force-dynamic'

// Página de retorno de Entra ID (Authorization Code + PKCE).
// El intercambio del code y la creación de sesión ocurren en el handler cliente.
export default function AuthCallbackPage() {
  const config = getAuthPublicConfig()
  return <CallbackHandler config={config} />
}
