import { authenticate } from "../middleware/authMiddleware"
import { createStream, findStreamById, getAllStreams, getActiveStreams, updateStreamStatus } from "../repositories/streamRepository"
import { db } from "../repositories/userRepository"

export async function handleCreateStream(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)

  if(!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

  const userRole = db.prepare("SELECT role FROM users WHERE id = ?").get(payload.userId) as { role: string } | null
  if(userRole?.role !== 'staff' && userRole?.role !== 'admin') {
    return new Response(JSON.stringify({ error: "Solo el staff puede crear transmisiones" }), { status: 403 })
  }

  const body = await req.json() as { title: string, membership_required: "none" | "gameboy" | "playboy" }
  const stream = createStream({
    title: body.title,
    status: "active",
    host_id: payload.userId,
    membership_required: body.membership_required
  })

  return new Response(JSON.stringify(stream), { status: 201 })
}

export async function handleGetActiveStreams(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })

  const streams = getActiveStreams()

  return new Response(JSON.stringify({ streams }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
}

export async function handleJoinStream(req: Request, id: number): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })

  const streamByid = findStreamById(id)
  if(!streamByid) {
    return new Response(JSON.stringify({ error: "Stream not found" }), { status: 404 })
  }

  const ACCESS_LEVELS: Record<string, number> = {
    "none": 0,
    "gameboy": 1,
    "playboy": 2
  }

  const userLevel = ACCESS_LEVELS[payload.membership] ?? 0
  const requiredLevel = ACCESS_LEVELS[streamByid.membership_required] ?? 0

  if(userLevel < requiredLevel) {
    return new Response(JSON.stringify({ error: "Membership required" }), { status: 403 })
  }

  return new Response(JSON.stringify({ message: "Stream status active" }), { status: 200 })
}

export async function handleEndStream(req: Request, id: number): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })

  const streamByid = findStreamById(id)
  if(!streamByid) {
    return new Response(JSON.stringify({ error: "Stream not found" }), { status: 404 })
  }

  if(streamByid.host_id !== payload.userId) {
    return new Response(JSON.stringify({ error: "Action not allowed" }), { status: 403 })
  }

  updateStreamStatus(id, "ended")
  return new Response(JSON.stringify({ message: "Stream ended successfully" }), { status: 200 })
}