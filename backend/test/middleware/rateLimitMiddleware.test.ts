import { describe, it, expect, beforeEach } from "bun:test"
import { rateLimitMiddleware,requestCounts } from "../../src/middleware/rateLimitMiddleware"

describe("RateLimitMiddleware", () => {
  beforeEach(() => {
    requestCounts.clear()
  })

  it("debería dejar pasar una petición normal", async () => {
    const req = new Request("http://localhost/auth/login", {
      headers: { "x-forwarded-for": "192.168.1.1" }
    })
    const result = await rateLimitMiddleware(req)
    expect(result).toBeNull()
  })

  it("debería bloquear después de 10 peticiones", async () => {
  const ip = "192.168.1.1"
  const makeRequest = () => new Request("http://localhost/auth/login", {
    headers: { "x-forwarded-for": ip }
  })

  for(let i = 0; i < 10; i++) {
    await rateLimitMiddleware(makeRequest())
  }

  const result = await rateLimitMiddleware(makeRequest())
  expect(result?.status).toBe(429)
})

it("debería reiniciar el contador después del tiempo límite", async () => {
  const ip = "192.168.1.2"
  requestCounts.set(ip, { count: 10, resetTime: Date.now() - 1 })

  const req = new Request("http://localhost/auth/login", {
    headers: { "x-forwarded-for": ip }
  })

  const result = await rateLimitMiddleware(req)
  expect(result).toBeNull()
})
})