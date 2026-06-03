import type { User } from "../models/user"
import { createUser, findUserByEmail } from "../repositories/userRepository"

export async function register(username: string, email: string, password: string): Promise<User> {
  const existing = await findUserByEmail(email)
  if (existing) {
    throw new Error('Email already registered')
  }
  const password_hash = await Bun.password.hash(password, "bcrypt")
  return createUser({ username, email, password_hash, membership: "none" })
}

export async function login(email: string, password: string): Promise<User | null> {
  const user = await findUserByEmail(email)
  if (!user) return null
  const valid = await Bun.password.verify(password, user.password_hash, "bcrypt")
  return valid ? user : null
}
