// ---------------------------------------------------------------------------
// Migración de usuarios de la app (Neon) a cuentas locales de Azure AD B2C.
//
// Crea en el directorio de B2C, vía Microsoft Graph, una cuenta local (email +
// contraseña) por cada usuario de la app que todavía no tenga b2cId. Guarda el
// oid devuelto en la columna user.b2cId, de modo que al iniciar sesión por B2C
// el callback vincule automáticamente al usuario con su registro de Neon
// (conservando su rol). Ver app/api/auth/b2c/callback/route.ts.
//
// SEGURO POR DEFECTO: sin --commit solo simula (dry-run) y no escribe nada.
//
// Requiere estas variables de entorno (a cargar por los admins de Azure):
//   GRAPH_TENANT_ID      - Directory (tenant) ID del tenant B2C
//   GRAPH_CLIENT_ID      - App registration con permiso de aplicación User.ReadWrite.All (+ admin consent)
//   GRAPH_CLIENT_SECRET  - Secret de esa app registration
// Ya disponibles en el proyecto:
//   DATABASE_URL             - conexión a Neon
//   AZURE_B2C_TENANT_DOMAIN  - dominio inicial del tenant (ej: fyob2c.onmicrosoft.com)
//
// Uso:
//   node --env-file-if-exists=/vercel/share/.env.project scripts/migrate-users-to-b2c.mjs            # dry-run
//   node --env-file-if-exists=/vercel/share/.env.project scripts/migrate-users-to-b2c.mjs --commit   # ejecuta
// ---------------------------------------------------------------------------
import { Pool } from 'pg'

const COMMIT = process.argv.includes('--commit')

const {
  DATABASE_URL,
  AZURE_B2C_TENANT_DOMAIN,
  GRAPH_TENANT_ID,
  GRAPH_CLIENT_ID,
  GRAPH_CLIENT_SECRET,
} = process.env

// --- Validación de configuración -------------------------------------------
function requireEnv() {
  const missing = []
  if (!DATABASE_URL) missing.push('DATABASE_URL')
  if (!AZURE_B2C_TENANT_DOMAIN) missing.push('AZURE_B2C_TENANT_DOMAIN')
  if (!GRAPH_TENANT_ID) missing.push('GRAPH_TENANT_ID')
  if (!GRAPH_CLIENT_ID) missing.push('GRAPH_CLIENT_ID')
  if (!GRAPH_CLIENT_SECRET) missing.push('GRAPH_CLIENT_SECRET')
  if (missing.length) {
    console.error(
      '\n[migrate-b2c] Faltan variables de entorno:\n  - ' +
        missing.join('\n  - ') +
        '\n\nLas de GRAPH_* las debe crear un administrador de Azure:\n' +
        '  1. Azure Portal → App registrations → New registration.\n' +
        '  2. API permissions → Microsoft Graph → Application permissions →\n' +
        '     User.ReadWrite.All → Grant admin consent.\n' +
        '  3. Certificates & secrets → New client secret.\n' +
        '  4. Cargar GRAPH_TENANT_ID, GRAPH_CLIENT_ID y GRAPH_CLIENT_SECRET.\n',
    )
    process.exit(1)
  }
}

// --- Contraseña temporal que cumple la política de B2C ----------------------
// (8-16 caracteres, con mayúscula, minúscula, dígito y símbolo).
function genPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnpqrstuvwxyz'
  const digit = '23456789'
  const sym = '!@#$%*?-'
  const pick = (s) => s[Math.floor(Math.random() * s.length)]
  let base = pick(upper) + pick(lower) + pick(digit) + pick(sym)
  const all = upper + lower + digit + sym
  for (let i = 0; i < 8; i++) base += pick(all)
  return base
}

// --- Token de Microsoft Graph (client credentials) --------------------------
async function getGraphToken() {
  const url = `https://login.microsoftonline.com/${GRAPH_TENANT_ID}/oauth2/v2.0/token`
  const body = new URLSearchParams({
    client_id: GRAPH_CLIENT_ID,
    client_secret: GRAPH_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  })
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    throw new Error(`token Graph falló (${res.status}): ${await res.text()}`)
  }
  return (await res.json()).access_token
}

// --- Crear una cuenta local de B2C ------------------------------------------
async function createB2CUser(token, { name, email, password }) {
  const res = await fetch('https://graph.microsoft.com/v1.0/users', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accountEnabled: true,
      displayName: name || email,
      identities: [
        {
          signInType: 'emailAddress',
          issuer: AZURE_B2C_TENANT_DOMAIN,
          issuerAssignedId: email,
        },
      ],
      passwordProfile: {
        password,
        forceChangePasswordNextSignIn: false,
      },
      passwordPolicies: 'DisablePasswordExpiration',
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status}: ${text}`)
  }
  return (await res.json()).id // oid del usuario en B2C
}

// --- Principal --------------------------------------------------------------
async function main() {
  requireEnv()
  console.log(
    `[migrate-b2c] modo: ${COMMIT ? 'COMMIT (escribe en B2C y Neon)' : 'DRY-RUN (solo simula)'}`,
  )

  const pool = new Pool({ connectionString: DATABASE_URL })
  const client = await pool.connect()

  const report = { total: 0, creados: 0, yaMigrados: 0, errores: 0, tempPasswords: [] }

  try {
    const { rows } = await client.query(
      `SELECT id, name, email, "plainPassword", "b2cId", role
         FROM "user"
        WHERE "b2cId" IS NULL
        ORDER BY "createdAt"`,
    )
    report.total = rows.length
    console.log(`[migrate-b2c] usuarios a migrar (sin b2cId): ${rows.length}`)

    const token = COMMIT ? await getGraphToken() : null

    for (const u of rows) {
      const email = u.email.toLowerCase()
      // Usa la contraseña guardada si existe; si no, genera una temporal.
      const hasStored = Boolean(u.plainPassword)
      const password = hasStored ? u.plainPassword : genPassword()

      if (!COMMIT) {
        console.log(
          `  [dry-run] crearía: ${email} (${u.role})` +
            (hasStored ? ' [contraseña propia]' : ' [contraseña temporal generada]'),
        )
        continue
      }

      try {
        const b2cId = await createB2CUser(token, { name: u.name, email, password })
        await client.query(`UPDATE "user" SET "b2cId" = $1, "updatedAt" = now() WHERE id = $2`, [
          b2cId,
          u.id,
        ])
        report.creados++
        if (!hasStored) report.tempPasswords.push({ email, password })
        console.log(`  [ok] ${email} -> b2cId ${b2cId}`)
      } catch (err) {
        // Si ya existe en B2C, lo marcamos como ya migrado (no es error fatal).
        if (String(err.message).includes('already exists') || String(err.message).includes('ObjectConflict')) {
          report.yaMigrados++
          console.warn(`  [skip] ${email} ya existe en B2C`)
        } else {
          report.errores++
          console.error(`  [error] ${email}: ${err.message}`)
        }
      }
    }

    console.log('\n[migrate-b2c] Resumen:', {
      total: report.total,
      creados: report.creados,
      yaMigrados: report.yaMigrados,
      errores: report.errores,
    })
    if (report.tempPasswords.length) {
      console.log(
        '\n[migrate-b2c] Contraseñas temporales generadas (compartir de forma segura):',
      )
      for (const t of report.tempPasswords) console.log(`  ${t.email}  ->  ${t.password}`)
    }
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((e) => {
  console.error('[migrate-b2c] ERROR:', e)
  process.exit(1)
})
