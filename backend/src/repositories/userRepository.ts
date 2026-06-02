import { Database } from "bun:sqlite"
import type { User } from "../models/user"
export {db}

const db = new Database(process.env.DATABASE_URL || "magic.db")

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    membership TEXT NOT NULL DEFAULT 'none',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

export function createUser(user: User): User {
  let newUser = db.prepare(`
  INSERT INTO users (username, email, password_hash, membership)
  VALUES ($username, $email, $passwordHash, $membership)
`)
  newUser.run({
  $username: user.username,
  $email: user.email,
  $passwordHash: user.password_hash,
  $membership: user.membership
})

return user
}

export function findUserByEmail(email: string): User | null {
  let userByEmail = db.prepare("SELECT * FROM users WHERE email = ?")
  return userByEmail.get(email) as User | null
}

export function updateUserMembership(userId: number, membership: string): void {
  const updatemembership = db.prepare("UPDATE users SET membership = ? WHERE id = ?")
  updatemembership.run(membership, userId)
}

export function updateUsername(userId: number, username: string): void {
  const updatename = db.prepare("UPDATE users SET username = ? WHERE id = ?")
  updatename.run(username, userId)
}

export function updatePassword(userId: number, passwordHash: string): void {
  const updatepassword = db.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
  updatepassword.run(passwordHash, userId)
}