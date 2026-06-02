import { describe, it, expect, beforeEach } from "bun:test"
import { createPayment, findPaymentsByUserId, paymentDB } from "../../src/repositories/paymentRepository"

describe("PaymentRepository", () => {
  beforeEach(() => {
    paymentDB.run("DELETE FROM payments")
  })

  it("debería crear un pago", () => {
    const payment = createPayment({
      user_id: 1,
      membership: "gameboy",
      amount: 9.99,
      status: "pending"
    })
    expect(payment.status).toBe("pending")
  })

  it("debería encontrar pagos por usuario", () => {
    createPayment({ user_id: 1, membership: "gameboy", amount: 9.99, status: "completed" })
    createPayment({ user_id: 1, membership: "playboy", amount: 19.99, status: "pending" })
    const payments = findPaymentsByUserId(1)
    expect(payments).toHaveLength(2)
  })
})