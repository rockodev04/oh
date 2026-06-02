import { describe, it, expect, beforeEach } from "bun:test"
import { handleRegister, handleLogin } from "../../src/routes/authRoutes"
import { db } from "../../src/repositories/userRepository"

describe("AuthRoutes", () => {
  beforeEach(() => {
    db.run("DELETE FROM users")
  })

  it("debería registrar un usuario y retornar 201", async () => {
    const req = new Request("http://localhost/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "lobo_2024",
        email: "lobo@hackers.com",
        password: "Hacker@123"
      })
    })
    const res = await handleRegister(req)
    expect(res.status).toBe(201)
  })

  it("debería retornar 409 si el email ya existe", async () => {
  const req = () => new Request("http://localhost/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "lobo_2024",
      email: "lobo@hackers.com",
      password: "Hacker@123"
    })
  })
  await handleRegister(req())
  const res = await handleRegister(req())
  expect(res.status).toBe(409)
})

it("debería hacer login y retornar un token", async () => {
  const reqRegister = new Request("http://localhost/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "lobo_2024",
      email: "lobo@hackers.com",
      password: "Hacker@123"
    })
  })
  await handleRegister(reqRegister)

  const reqLogin = new Request("http://localhost/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "lobo@hackers.com",
      password: "Hacker@123"
    })
  })
  const res = await handleLogin(reqLogin)
  expect(res.status).toBe(200)
})
})