import { authenticate } from "../middleware/authMiddleware"
import { updateUserMembership } from "../repositories/userRepository"
import {isMembershipActive } from "../services/membershipService"


export async function handleAssignMembership(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
    const token = authHeader?.split(" ")[1]
    const payload = await authenticate(token)
    
    if(!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    
    if(payload.membership === "none") {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 })
  }

  const body = await req.json() as { membership: "gameboy" | "playboy" }
updateUserMembership(payload.userId, body.membership)

return new Response(JSON.stringify({ message: "Membership updated" }), { status: 200 })
}

export async function handleGetMembership(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })
  
  return new Response(JSON.stringify({ membership: payload.membership }), { status: 200 })
}

export async function handleCancelMembership(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })

  updateUserMembership(payload.userId, "none")
  return new Response(JSON.stringify({ message: "Membership canceled" }), { status: 200 })

}

export async function handleCheckMembership(req: Request): Promise<Response>{
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })

  const isActive = isMembershipActive(payload.userId)
  return new Response(JSON.stringify({ isActive }), { status: 200 })
}