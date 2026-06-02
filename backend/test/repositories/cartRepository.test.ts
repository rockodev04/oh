import { describe, it, expect, beforeEach } from "bun:test"
import { addToCart, getCartByUserId, removeFromCart, cartDb } from "../../src/repositories/cartRepository"

describe("CartRepository", () => {
  beforeEach(() => {
    cartDb.run("DELETE FROM carts")
  })

  it("debería agregar un producto al carrito", () => {
    const item = addToCart({ user_id: 1, product_id: 1, quantity: 2 })
    expect(item.product_id).toBe(1)
  })

  it("debería obtener el carrito de un usuario", () => {
    addToCart({ user_id: 1, product_id: 1, quantity: 2 })
    addToCart({ user_id: 1, product_id: 2, quantity: 1 })
    const cart = getCartByUserId(1)
    expect(cart).toHaveLength(2)
  })

  it("debería eliminar un producto del carrito", () => {
    const item = addToCart({ user_id: 1, product_id: 1, quantity: 2 })
    removeFromCart(item.id!)
    const cart = getCartByUserId(1)
    expect(cart).toHaveLength(0)
  })
})