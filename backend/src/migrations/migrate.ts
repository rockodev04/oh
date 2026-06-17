// ============================================
// migrate.ts — OnlyHackers DB Migration
// Corre con: bun run db:migrate
// ============================================

import postgres from "postgres"
import { readFileSync } from "fs"
import { join } from "path"

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://junkdog@localhost:5432/onlyhackers'

const sql = postgres(DATABASE_URL, { ssl: false })

async function migrate() {
  console.log('🗄️  Iniciando migración...')

  try {
    // ── 1. Verificar conexión ──
    await sql`SELECT 1`
    console.log('✅ Conexión a PostgreSQL exitosa')

    // ── 2. Habilitar pgcrypto ──
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`
    console.log('✅ pgcrypto habilitado')

    // ── 3. Correr schema completo ──
    const schemaPath = join(import.meta.dir, '../migrations/schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')
    await sql.unsafe(schema)
    console.log('✅ Schema aplicado')

    // ── 4. Verificar columnas críticas ──
    const cols = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name IN ('users', 'messages')
        AND column_name IN ('email', 'content')
      ORDER BY table_name, column_name
    `

    let hasErrors = false
    cols.forEach((col: any) => {
      if (col.data_type === 'bytea') {
        console.error(`❌ Columna ${col.column_name} sigue siendo BYTEA — aplica el fix manualmente`)
        hasErrors = true
      } else {
        console.log(`✅ ${col.column_name} → ${col.data_type}`)
      }
    })

    if (hasErrors) {
      console.log('\n⚠️  Corre esto para corregir las columnas:')
      console.log('ALTER TABLE users ALTER COLUMN email TYPE TEXT USING NULL;')
      console.log('ALTER TABLE messages ALTER COLUMN content TYPE TEXT USING NULL;')
      process.exit(1)
    }

    console.log('\n🚀 Migración completada exitosamente')

  } catch (err) {
    console.error('❌ Error en migración:', err)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

migrate()
