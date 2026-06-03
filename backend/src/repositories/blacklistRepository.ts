import sql from "../database"
import { hashText } from "../database"

export async function addIpToBlacklist(ip: string): Promise<void> {
  const hashedIp = await hashText(ip)
  await sql`
    INSERT INTO blacklist (ip)
    VALUES (${hashedIp})
    ON CONFLICT (ip) DO NOTHING
  `
}

export async function isIpBlacklisted(ip: string): Promise<boolean> {
  const hashedIp = await hashText(ip)
  const result = await sql`SELECT 1 FROM blacklist WHERE ip = ${hashedIp}`
  return result.length > 0
}
