import { describe, it, expect, beforeEach } from "bun:test"
import { blacklistMiddleware } from "../../src/middleware/blacklistMiddleware"
import { addIpToBlacklist, blackList } from "../../src/repositories/blacklistRepository"

describe("BlacklistMiddleware", () => {
  beforeEach(() => {
    blackList.run("DELETE FROM blacklist")
  })

  it("debería dejar pasar una IP no baneada", async() => {
    const req = new Request("http://localhost/", {
      headers: { "x-forwarded-for": "192.168.1.1" }
    })
    const result = await blacklistMiddleware(req)    
    expect(result).toBeNull()
  })

  it("debería bloquear una IP baneada con 403", async () => {
  addIpToBlacklist("192.168.1.1")
  const req = new Request("http://localhost/", {
    headers: { "x-forwarded-for": "192.168.1.1" }
  })
  const result = await blacklistMiddleware(req)
  expect(result?.status).toBe(403)
})

it("debería dejar pasar una IP que no está baneada", async () => {
  addIpToBlacklist("10.0.0.1")
  const req = new Request("http://localhost/", {
    headers: { "x-forwarded-for": "192.168.1.1" }
  })
  const result = await blacklistMiddleware(req)
  expect(result).toBeNull()
})
})