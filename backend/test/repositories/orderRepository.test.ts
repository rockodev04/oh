import { describe, it, expect, beforeEach } from "bun:test"
import { createOrder, findOrdersByUserId, orderDB } from "../../src/repositories/orderRepository"

describe("OrderRepository", () => {
  beforeEach(() => {
    orderDB.run("DELETE FROM orders")
  })

  it("debería crear una orden", () => {
    const order = createOrder({ user_id: 1, total: 29.99, status: "completed" })
    expect(order.status).toBe("completed")
  })

  it("debería encontrar órdenes por usuario", () => {
    createOrder({ user_id: 1, total: 29.99, status: "completed" })
    createOrder({ user_id: 1, total: 9.99, status: "completed" })
    const orders = findOrdersByUserId(1)
    expect(orders).toHaveLength(2)
  })
})