import { describe, it, expect } from "bun:test"
import { generateToken, verifyToken } from "../../src/services/jwtService"

describe("JwtService", () => {
  it("debería generar un token válido", async () => {
    const token = await generateToken(1, "gameboy")
    expect(token).toBeTruthy()
    expect(typeof token).toBe("string")
  })

  it("debería verificar un token válido", async () => {
  const token = await generateToken(1, "gameboy")
  const payload = await verifyToken(token)
  expect(payload?.userId).toBe(1)
  expect(payload?.membership).toBe("gameboy")
})

it("debería retornar null para un token inválido", async () => {
  const payload = await verifyToken("token.invalido.firma")
  expect(payload).toBeNull()
})
})