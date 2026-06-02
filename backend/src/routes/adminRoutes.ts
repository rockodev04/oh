import { authenticate } from "../middleware/authMiddleware"
import { db } from "../repositories/userRepository"
import type { UserRow } from "../models/admin"

function isAdmin(token: string | undefined): Promise<boolean> {
  return authenticate(token).then(payload => {
    if (!payload) return false
    const user = db.prepare("SELECT role FROM users WHERE id = ?").get(payload.userId) as { role: string } | null
    return user?.role === 'admin'
  })
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

  const users = db.prepare("SELECT id, username, email, membership, role FROM users").all() as UserRow[]
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

  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(body.role, userId)

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

  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId) as { id: number } | null
  if (!user) {
    return new Response(JSON.stringify({ error: "Usuario no encontrado" }), { status: 404 })
  }

  db.prepare("DELETE FROM users WHERE id = ?").run(userId)

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

  const totalUsers = (db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number }).count
  const totalArticles = (db.prepare("SELECT COUNT(*) as count FROM articles").get() as { count: number }).count
  const totalStaff = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'staff'").get() as { count: number }).count
  const totalStreams = (db.prepare("SELECT COUNT(*) as count FROM streams").get() as { count: number }).count
  const membershipGameboy = (db.prepare("SELECT COUNT(*) as count FROM users WHERE membership = 'gameboy'").get() as { count: number }).count
  const membershipPlayboy = (db.prepare("SELECT COUNT(*) as count FROM users WHERE membership = 'playboy'").get() as { count: number }).count

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