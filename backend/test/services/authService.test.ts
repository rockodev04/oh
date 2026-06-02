import { describe, it, expect, beforeEach } from "bun:test"
import { db } from "../../src/repositories/userRepository"
import { register, login } from "../../src/services/authService"

describe("AuthService", () => {
  beforeEach(() => {
    db.run("DELETE FROM users")
  })

  it("debería registrar un usuario con contraseña hasheada", async () => {
    const user = await register("lobo_2024", "lobo@hackers.com", "Hacker@123")
    expect(user.email).toBe("lobo@hackers.com")
    expect(user.password_hash).not.toBe("Hacker@123")
  })

  it("no debería registrar un usuario con email duplicado", async () => {
    await register("lobo_2024", "lobo@hackers.com", "Hacker@123")
    await expect(register("lobo_2024", "lobo@hackers.com", "Hacker@123")).rejects.toThrow("Email register")
  })

  it("debería hacer login con credenciales correctas", async () => {
    await register("lobo_2024", "lobo@hackers.com", "Hacker@123")
    const user = await login("lobo@hackers.com", "Hacker@123")
    expect(user?.email).toBe("lobo@hackers.com")
  })

  it("debería retornar null con contraseña incorrecta", async () => {
    await register("lobo_2024", "lobo@hackers.com", "Hacker@123")
    const user = await login("lobo@hackers.com", "WrongPassword@123")
    expect(user).toBeNull()
  })

  it("debería retornar null si el usuario no existe", async () => {
    const user = await login("noexiste@hackers.com", "Hacker@123")
    expect(user).toBeNull()
  })
})