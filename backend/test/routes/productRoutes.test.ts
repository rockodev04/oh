import { describe, it, expect, beforeEach } from "bun:test"
import { handleGetProducts, handleCreateProduct } from "../../src/routes/productRoutes"
import { generateToken } from "../../src/services/jwtService"
import { productDb } from "../../src/repositories/productRepository"

describe("ProductRoutes", () => {
  beforeEach(() => {
    productDb.run("DELETE FROM products")
  })

  it("debería retornar 401 sin token", async () => {
    const req = new Request("http://localhost/products")
    const res = await handleGetProducts(req)
    expect(res.status).toBe(401)
  })

  it("debería listar productos con token válido", async () => {
    const token = await generateToken(1, "gameboy")
    const req = new Request("http://localhost/products", {
      headers: { "Authorization": `Bearer ${token}` }
    })
    const res = await handleGetProducts(req)
    expect(res.status).toBe(200)
  })
})