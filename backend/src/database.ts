// ============================================
// database.ts — Conexión a PostgreSQL
// Helpers de cifrado con pgcrypto
// ============================================

import postgres from "postgres"

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://junkdog@localhost:5432/onlyhackers'

const sql = postgres(DATABASE_URL, {
  ssl: false
})

export default sql

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ?? 'default_key_change_in_production'

// ✅ database.ts — encrypt y decrypt corregidos

export async function encrypt(text: string): Promise<string> {
  const result = await sql`
    SELECT encode(pgp_sym_encrypt(${text}, ${ENCRYPTION_KEY}), 'hex') AS encrypted
  `
  return result[0]?.encrypted as string
}

export async function decrypt(encrypted: string): Promise<string> {
  const result = await sql`
    SELECT pgp_sym_decrypt(
      decode(${encrypted}::text, 'hex'),
      ${ENCRYPTION_KEY}
    ) AS decrypted
  `
  return result[0]?.decrypted
}

export async function hashText(text: string): Promise<string> {
  const result = await sql`
    SELECT encode(
      digest(${text}, 'sha256'),
      'hex'
    ) AS hash
  `
  return result[0]?.hash
}
