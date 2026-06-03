import { authenticate } from "../middleware/authMiddleware"
import sql from "../database"
import { getAllUsers, deleteUser } from "../repositories/userRepository"
import type { UserRow } from "../models/admin"

async function isAdmin(token: string | undefined): Promise<boolean> {
  const payload = await authenticate(token)
  if (!payload) return false
  const result = await sql`SELECT role FROM users WHERE id = ${payload.userId}`
  return result[0]?.role === 'admin'
}

async function getAdminId(token: string | undefined): Promise<number | null> {
  const payload = await authenticate(token)
  return payload?.userId ?? null
}

export async function handleGetUsers(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]

  if (!await isAdmin(token)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const users = await getAllUsers()
  return new Response(JSON.stringify({ users }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
}

export async function handleUpdateUserRole(req: Request, userId: number): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]

  if (!await isAdmin(token)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const body = await req.json() as { role: "none" | "staff" | "admin" }

  if (!["none", "staff", "admin"].includes(body.role)) {
    return new Response(JSON.stringify({ error: "Invalid role" }), { status: 400 })
  }

  await sql`UPDATE users SET role = ${body.role} WHERE id = ${userId}`

  return new Response(JSON.stringify({ message: "Role updated" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
}

export async function handleDeleteUser(req: Request, userId: number): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]

  if (!await isAdmin(token)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const adminId = await getAdminId(token)
  if (adminId === userId) {
    return new Response(JSON.stringify({ error: "No puedes eliminarte a ti mismo" }), { status: 403 })
  }

  const result = await sql`SELECT id FROM users WHERE id = ${userId}`
  if (!result.length) {
    return new Response(JSON.stringify({ error: "Usuario no encontrado" }), { status: 404 })
  }

  await deleteUser(userId)

  return new Response(JSON.stringify({ message: "Usuario eliminado correctamente" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
}

export async function handleGetStats(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]

  if (!await isAdmin(token)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const [users, articles, staff, streams, gameboy, playboy] = await Promise.all([
    sql`SELECT COUNT(*) AS count FROM users`,
    sql`SELECT COUNT(*) AS count FROM articles`,
    sql`SELECT COUNT(*) AS count FROM users WHERE role = 'staff'`,
    sql`SELECT COUNT(*) AS count FROM streams`,
    sql`SELECT COUNT(*) AS count FROM users WHERE membership = 'gameboy'`,
    sql`SELECT COUNT(*) AS count FROM users WHERE membership = 'playboy'`
  ])

  const totalUsers = parseInt(users[0]?.count)
  const totalArticles = parseInt(articles[0]?.count)
  const totalStaff = parseInt(staff[0]?.count)
  const totalStreams = parseInt(streams[0]?.count)
  const membershipGameboy = parseInt(gameboy[0]?.count)
  const membershipPlayboy = parseInt(playboy[0]?.count)

  return new Response(JSON.stringify({
    stats: {
      totalUsers,
      totalArticles,
      totalStaff,
      totalStreams,
      memberships: {
        none: totalUsers - membershipGameboy - membershipPlayboy,
        gameboy: membershipGameboy,
        playboy: membershipPlayboy
      }
    }
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
}
