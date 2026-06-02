import { Database } from "bun:sqlite"

export const blackList = new Database(process.env.DATABASE_URL || "magic.db")

blackList.run(`
  CREATE TABLE IF NOT EXISTS blacklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

export function addIpToBlacklist(ip: string): void {
  const addIp = blackList.prepare("INSERT OR IGNORE INTO blacklist (ip) VALUES (?)")
  addIp.run(ip)
}

export function isIpBlacklisted(ip: string):boolean {
  const verifyIp = blackList.prepare("SELECT 1 FROM blacklist WHERE ip = ?")
  const result = verifyIp.get(ip)
  return !!result
}


