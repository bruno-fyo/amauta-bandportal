import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id serial PRIMARY KEY,
        "userId" text,
        "userEmail" text NOT NULL,
        "userName" text,
        "userRole" text NOT NULL,
        type text NOT NULL,
        "assetId" integer,
        target text,
        detail text,
        "ipAddress" text,
        "userAgent" text,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `)
    await client.query(
      `CREATE INDEX IF NOT EXISTS activity_log_created_idx ON activity_log ("createdAt" DESC)`,
    )
    await client.query(
      `CREATE INDEX IF NOT EXISTS activity_log_user_idx ON activity_log ("userId", "createdAt" DESC)`,
    )
    await client.query(
      `CREATE INDEX IF NOT EXISTS activity_log_type_idx ON activity_log (type, "createdAt" DESC)`,
    )
    console.log('[migrate] activity_log lista')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
