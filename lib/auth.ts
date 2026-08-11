import { betterAuth } from 'better-auth'
import { emailOTP } from 'better-auth/plugins'
import { Pool } from 'pg'
import { and, eq, sql } from 'drizzle-orm'
import { db } from './db'
import { user as userTable, account as accountTable } from './db/schema'
import { sendPasswordResetEmail } from './email'

// ¿El email pertenece a una cuenta LOCAL (con credencial email+contraseña)?
// Devuelve false para emails inexistentes y para cuentas que solo usan
// Microsoft (Entra ID), que no tienen fila `credential` en `account`.
// Esto bloquea la recuperación por OTP de cuentas Microsoft-only y refuerza la
// protección contra enumeración de usuarios.
async function emailHasLocalCredential(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase()
  const rows = await db
    .select({ id: accountTable.id })
    .from(accountTable)
    .innerJoin(userTable, eq(accountTable.userId, userTable.id))
    .where(
      and(
        sql`lower(${userTable.email}) = ${normalized}`,
        eq(accountTable.providerId, 'credential'),
      ),
    )
    .limit(1)
  return rows.length > 0
}

function getBaseURL() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.V0_RUNTIME_URL) return process.env.V0_RUNTIME_URL
  return 'http://localhost:3000'
}

const trustedOrigins = [
  'http://localhost:3000',
  // Dominios del preview de v0 y de los despliegues de Vercel (comodines)
  'https://*.vusercontent.net',
  'https://*.v0.dev',
  'https://*.v0.app',
  'https://*.vercel.app',
  'https://*.vercel.run',
  process.env.V0_RUNTIME_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined,
  process.env.BETTER_AUTH_URL,
].filter(Boolean) as string[]

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  baseURL: getBaseURL(),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    // Al restablecer la contraseña, cerrar todas las sesiones activas del usuario.
    revokeSessionsOnPasswordReset: true,
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600, // 10 minutos
      allowedAttempts: 3, // límite de intentos de validación por código
      // Límite de solicitudes/reenvíos (anti-abuso).
      rateLimit: { window: 60, max: 3 },
      async sendVerificationOTP({ email, otp, type }) {
        // Solo intervenimos el flujo de recuperación de contraseña.
        if (type !== 'forget-password') return
        // Únicamente cuentas locales: bloquea Microsoft-only e inexistentes.
        // (Respuesta genérica al cliente: nunca se revela si el email existe.)
        if (!(await emailHasLocalCredential(email))) return
        try {
          await sendPasswordResetEmail(email, otp)
        } catch {
          // El fallo ya quedó registrado (log genérico, sin datos sensibles) en
          // sendPasswordResetEmail. No re-lanzamos para mantener la respuesta
          // anti-enumeración: el usuario siempre ve el mismo mensaje genérico.
        }
      },
    }),
  ],
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'colaborador',
        input: false, // el rol no se puede setear desde el cliente al registrarse
      },
    },
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})
