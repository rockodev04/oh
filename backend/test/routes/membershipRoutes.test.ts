import { describe, it, expect, beforeEach } from "bun:test"
import { handleAssignMembership, handleGetMembership, handleCancelMembership, handleCheckMembership } from "../../src/routes/membershipRoutes"
import { generateToken } from "../../src/services/jwtService"
import { db } from "../../src/repositories/userRepository"

describe("MembershipRoutes", () => {
  beforeEach(() => {
    db.run("DELETE FROM users")
  })

  it("debería retornar 401 sin token", async () => {
    const req = new Request("http://localhost/membership", {
      method: "POST"
    })
    const res = await handleAssignMembership(req)
    expect(res.status).toBe(401)
  })

  it("debería asignar membresía gameboy", async () => {
  const token = await generateToken(1, "gameboy")
  const req = new Request("http://localhost/membership", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ membership: "gameboy" })
  })
  const res = await handleAssignMembership(req)
  expect(res.status).toBe(200)
})

it("debería retornar la membresía actual", async () => {
  const token = await generateToken(1, "gameboy")
  const req = new Request("http://localhost/membership", {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const res = await handleGetMembership(req)
  expect(res.status).toBe(200)
})

it("debería cancelar la membresía", async () => {
  const token = await generateToken(1, "gameboy")
  const req = new Request("http://localhost/membership", {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  })
  const res = await handleCancelMembership(req)
  expect(res.status).toBe(200)
})

it("debería retornar el estado de la membresía", async () => {
  const token = await generateToken(1, "gameboy")
  const req = new Request("http://localhost/membership/status", {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const res = await handleCheckMembership(req)
  expect(res.status).toBe(200)
})

it("debería cancelar la membresía con token válido", async () => {
  const token = await generateToken(1, "gameboy")
  const req = new Request("http://localhost/membership", {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  })
  const res = await handleCancelMembership(req)
  expect(res.status).toBe(200)
})
})