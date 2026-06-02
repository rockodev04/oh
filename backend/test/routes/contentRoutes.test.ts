import { describe, it, expect, beforeEach } from "bun:test"
import { handleMe, handleContent } from "../../src/routes/contentRoutes"
import { generateToken } from "../../src/services/jwtService"
import { db } from "../../src/repositories/userRepository"

describe("ContentRoutes", () => {
  beforeEach(() => {
    db.run("DELETE FROM users")
  })

  it("debería retornar 401 sin token", async () => {
    const req = new Request("http://localhost/me")
    const res = await handleMe(req)
    expect(res.status).toBe(401)
  })

  it("debería retornar 401 con token inválido", async () => {
  const req = new Request("http://localhost/me", {
    headers: { "Authorization": "Bearer token.invalido.firma" }
  })
  const res = await handleMe(req)
  expect(res.status).toBe(401)
})

it("debería retornar 200 con token válido", async () => {
  const token = await generateToken(1, "gameboy")
  const req = new Request("http://localhost/me", {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const res = await handleMe(req)
  expect(res.status).toBe(200)
})

it("debería retornar 401 sin token en /content", async () => {
  const req = new Request("http://localhost/content")
  const res = await handleContent(req)
  expect(res.status).toBe(401)
})

it("debería retornar contenido filtrado según membresía", async () => {
  const token = await generateToken(1, "none")
  const req = new Request("http://localhost/content", {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const res = await handleContent(req)
  expect(res.status).toBe(200)
  const body = await res.json() as { articles: any[] }
  expect(Array.isArray(body.articles)).toBe(true)
})
})

