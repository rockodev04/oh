import { describe, it, expect, beforeEach } from "bun:test"
import { createUser, findUserByEmail, db } from "../../src/repositories/userRepository"


describe("UserRepository", () => {
  beforeEach(() => {
    db.run("DELETE FROM users")
  })

  it("debería encontrar un usuario por email", async () => {
    await createUser({
      username: "lobo_2024",
      email: "lobo@hackers.com",
      password_hash: "hash_seguro",
      membership: "none"
    })
    const user = findUserByEmail("lobo@hackers.com")
    expect(user?.email).toBe("lobo@hackers.com")
  })

  it("debería crear un usuario en la base de datos", async () => {
  const user = await createUser({
    username: "lobo_2024",
    email: "lobo@hackers.com",
    password_hash: "hash_seguro",
    membership: "none"
  })
  expect(user.email).toBe("lobo@hackers.com")
})

  it("debería retornar null si el usuario no existe", () => {
    const user = findUserByEmail("noexiste@hackers.com")
    expect(user).toBeNull()
  })
})