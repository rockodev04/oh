import sql from "../database"
import { encrypt, decrypt, hashText } from "../database"
import type { User } from "../models/user"

export async function createUser(user: User): Promise<User> {
  const encryptedEmail = await encrypt(user.email)
  const emailHash = await hashText(user.email)
  const result = await sql`
    INSERT INTO users (username, email, email_hash, password_hash, membership)
    VALUES (${user.username}, ${encryptedEmail}, ${emailHash}, ${user.password_hash}, ${user.membership})
    RETURNING id, username, membership, role
  `
  return { ...user, id: result[0]?.id }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const emailHash = await hashText(email)
  const result = await sql`
    SELECT id, username, email, password_hash, membership, role
    FROM users WHERE email_hash = ${emailHash}
  `
  
  return {
    id: result[0]?.id,
    username: result[0]?.username,
    email: await decrypt(result[0]?.email),
    password_hash: result[0]?.password_hash,
    membership: result[0]?.membership,
    role: result[0]?.role
  }
}

export async function updateUserMembership(userId: number, membership: string): Promise<void> {
  await sql`UPDATE users SET membership = ${membership} WHERE id = ${userId}`
}

export async function updateUsername(userId: number, username: string): Promise<void> {
  await sql`UPDATE users SET username = ${username} WHERE id = ${userId}`
}

export async function updatePassword(userId: number, passwordHash: string): Promise<void> {
  await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}`
}

export async function deleteUser(userId: number): Promise<void> {
  await sql`DELETE FROM users WHERE id = ${userId}`
}

export async function getAllUsers(): Promise<User[]> {
  const result = await sql`
    SELECT id, username, email, membership, role FROM users ORDER BY id
  `
  return Promise.all(result.map(async (u: any) => ({
    id: u.id,
    username: u.username,
    email: await decrypt(u.email),
    password_hash: '',
    membership: u.membership,
    role: u.role
  })))
}

export async function getUserRole(userId: number): Promise<string> {
  const result = await sql`SELECT role FROM users WHERE id = ${userId}`
  return result[0]?.role ?? 'none'
}
