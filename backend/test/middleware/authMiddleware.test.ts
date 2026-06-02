import { describe, it, expect } from "bun:test"
import { authenticate } from "../../src/middleware/authMiddleware"
import { generateToken, verifyToken } from "../../src/services/jwtService"

describe("AuthMiddleware", () => {
  it("debería retornar null si no hay token", async () => {
    const result = await authenticate(undefined)
    expect(result).toBeNull()
  })

  it("debería retornar null para un token inválido", async () => {
  const result = await authenticate("token.invalido.firma")
  expect(result).toBeNull()
})

it("debería retornar el payload para un token válido", async () => {
  const token = await generateToken(1, "gameboy")
  const result = await authenticate(token)
  expect(result?.userId).toBe(1)
  expect(result?.membership).toBe("gameboy")
})
})