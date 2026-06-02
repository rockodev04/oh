import { describe, it, expect, beforeEach } from "bun:test"
import { handleAddToCart, handleGetCart, handleRemoveFromCart } from "../../src/routes/cartRoutes"
import { generateToken } from "../../src/services/jwtService"
import { cartDb } from "../../src/repositories/cartRepository"

describe("CartRoutes", () => {
  beforeEach(() => {
    cartDb.run("DELETE FROM carts")
  })

  it("debería retornar 401 sin token", async () => {
    const req = new Request("http://localhost/cart", { method: "POST" })
    const res = await handleAddToCart(req)
    expect(res.status).toBe(401)
  })

  it("debería agregar al carrito con token válido", async () => {
    const token = await generateToken(1, "gameboy")
    const req = new Request("http://localhost/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ product_id: 1, quantity: 2 })
    })
    const res = await handleAddToCart(req)
    expect(res.status).toBe(201)
  })

  it("debería obtener el carrito con token válido", async () => {
    const token = await generateToken(1, "gameboy")
    const req = new Request("http://localhost/cart", {
      headers: { "Authorization": `Bearer ${token}` }
    })
    const res = await handleGetCart(req)
    expect(res.status).toBe(200)
  })
})