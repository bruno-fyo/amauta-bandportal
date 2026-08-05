import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const client = await pool.connect()
  try {
    console.log('[migrate] iniciando…')

    // 1. Nuevas columnas para B2C (idempotente).
    await client.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "b2cId" text`)
    await client.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "lastLoginAt" timestamp`,
    )

    // 2. Índice único para b2cId (permite múltiples NULL en Postgres).
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'user_b2cId_unique'
        ) THEN
          ALTER TABLE "user" ADD CONSTRAINT "user_b2cId_unique" UNIQUE ("b2cId");
        END IF;
      END $$;
    `)

    // 3. Convertir rol comercial -> colaborador.
    const roleRes = await client.query(
      `UPDATE "user" SET role = 'colaborador' WHERE role = 'comercial'`,
    )
    console.log(`[migrate] usuarios comercial->colaborador: ${roleRes.rowCount}`)

    // 4. Cambiar el default de la columna role.
    await client.query(`ALTER TABLE "user" ALTER COLUMN role SET DEFAULT 'colaborador'`)

    // 5. Normalizar assets.visibility: reemplazar 'comercial' por 'colaborador'.
    const visRes = await client.query(`
      UPDATE assets
      SET visibility = array_replace(visibility, 'comercial', 'colaborador')
      WHERE 'comercial' = ANY(visibility)
    `)
    console.log(`[migrate] assets con visibility normalizada: ${visRes.rowCount}`)

    // 6. Verificación: distribución de roles.
    const check = await client.query(
      `SELECT role, count(*)::int AS n FROM "user" GROUP BY role ORDER BY role`,
    )
    console.log('[migrate] roles actuales:', check.rows)

    console.log('[migrate] OK')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((e) => {
  console.error('[migrate] ERROR:', e)
  process.exit(1)
})
