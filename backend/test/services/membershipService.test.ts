import { describe, it, expect, beforeEach } from "bun:test"
import { isMembershipActive, cancelMembership } from "../../src/services/membershipService"
import { createPayment } from "../../src/repositories/paymentRepository"
import { paymentDB } from "../../src/repositories/paymentRepository"

describe("MembershipService", () => {
  beforeEach(() => {
    paymentDB.run("DELETE FROM payments")
  })

  it("debería retornar false si no hay pagos", () => {
    expect(isMembershipActive(1)).toBe(false)
  })

  it("debería retornar true si hay un pago completado", () => {
    const { createPayment } = require("../../src/repositories/paymentRepository")
    createPayment({ user_id: 1, membership: "gameboy", amount: 9.99, status: "completed" })
    expect(isMembershipActive(1)).toBe(true)
  })

  it("debería cancelar la membresía", () => {
  createPayment({ user_id: 1, membership: "gameboy", amount: 9.99, status: "completed" })
  cancelMembership(1)
  expect(isMembershipActive(1)).toBe(false)
})
})