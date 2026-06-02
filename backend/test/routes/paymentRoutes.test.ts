import { describe, it, expect, beforeEach } from "bun:test"
import { handleCreatePayment } from "../../src/routes/paymentRoutes"
import { generateToken } from "../../src/services/jwtService"
import { paymentDB } from "../../src/repositories/paymentRepository"
import { db } from "../../src/repositories/userRepository"

describe("PaymentRoutes", () => {
  beforeEach(() => {
    paymentDB.run("DELETE FROM payments")
    db.run("DELETE FROM users")
  })

  it("debería retornar 401 sin token", async () => {
    const req = new Request("http://localhost/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membership: "gameboy", amount: 9.99 })
    })
    const res = await handleCreatePayment(req)
    expect(res.status).toBe(401)
  })

  it("debería crear un pago con token válido", async () => {
    const token = await generateToken(1, "gameboy")
    const req = new Request("http://localhost/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ membership: "gameboy", amount: 9.99 })
    })
    const res = await handleCreatePayment(req)
    expect(res.status).toBe(201)
  })
})