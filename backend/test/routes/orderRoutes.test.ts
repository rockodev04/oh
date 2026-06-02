import { describe, it, expect, beforeEach } from "bun:test"
import { handleProcessOrder,handleGetOrders } from "../../src/routes/orderRoutes"
import { generateToken } from "../../src/services/jwtService"
import { orderDB } from "../../src/repositories/orderRepository"
import { cartDb } from "../../src/repositories/cartRepository"
import { productDb } from "../../src/repositories/productRepository"

describe("OrderRoutes", () => {
  beforeEach(() => {
    orderDB.run("DELETE FROM orders")
    cartDb.run("DELETE FROM carts")
    productDb.run("DELETE FROM products")
  })

  it("debería retornar 401 sin token", async () => {
    const req = new Request("http://localhost/orders", { method: "POST" })
    const res = await handleProcessOrder(req)
    expect(res.status).toBe(401)
  })

  it("debería procesar una orden con carrito vacío", async () => {
    const token = await generateToken(1, "gameboy")
    const req = new Request("http://localhost/orders", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    })
    const res = await handleProcessOrder(req)
    expect(res.status).toBe(400)
  })

  it("debería obtener el historial de compras", async () => {
  const token = await generateToken(1, "gameboy")
  const req = new Request("http://localhost/orders", {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const res = await handleGetOrders(req)
  expect(res.status).toBe(200)
})
})