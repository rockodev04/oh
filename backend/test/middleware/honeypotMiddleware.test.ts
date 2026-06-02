import { describe, it, expect, beforeEach } from "bun:test"
import { honeypotMiddleware } from "../../src/middleware/honeypotMiddleware"
import { blackList,isIpBlacklisted } from "../../src/repositories/blacklistRepository"

describe("HoneypotMiddleware", () => {
  beforeEach(() => {
    blackList.run("DELETE FROM blacklist")
  })

  it("debería dejar pasar una ruta normal", async () => {
    const req = new Request("http://localhost/home", {
      headers: { "x-forwarded-for": "192.168.1.1" }
    })
    const result = await honeypotMiddleware(req)
    expect(result).toBeNull()
  })
  it("debería bloquear y banear una IP que visita ruta trampa", async () => {
  const req = new Request("http://localhost/wp-admin", {
    headers: { "x-forwarded-for": "192.168.1.1" }
  })
  const result = await honeypotMiddleware(req)
  expect(result?.status).toBe(403)
})

it("debería banear la IP automáticamente al visitar /.env", async () => {
  const req = new Request("http://localhost/.env", {
    headers: { "x-forwarded-for": "10.0.0.5" }
  })
  await honeypotMiddleware(req)
  const isBlacklisted = isIpBlacklisted("10.0.0.5")
  expect(isBlacklisted).toBe(true)
})
})