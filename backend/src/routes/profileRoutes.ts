import { authenticate } from "../middleware/authMiddleware"
import { updateUsername, updatePassword } from "../repositories/userRepository"
import { isMembershipActive, cancelMembership } from "../services/membershipService"
import { findPaymentsByUserId } from "../repositories/paymentRepository"
import { createPayment } from "../repositories/paymentRepository"
import { updateUserMembership } from "../repositories/userRepository"
 
export async function handleUpdateUsername(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if (!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
 
  const body = await req.json() as { username: string }
  if (!body.username || body.username.length < 8) {
    return new Response(JSON.stringify({ error: "Username debe tener mínimo 8 caracteres" }), { status: 400 })
  }
 
  updateUsername(payload.userId, body.username)
  return new Response(JSON.stringify({ message: "Username actualizado" }), { status: 200 })
}
 
export async function handleChangePassword(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if (!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
 
  const body = await req.json() as { password: string }
  if (!body.password) {
    return new Response(JSON.stringify({ error: "Password requerido" }), { status: 400 })
  }
 
  const hash = await Bun.password.hash(body.password, "bcrypt")
  updatePassword(payload.userId, hash)
  return new Response(JSON.stringify({ message: "Contraseña actualizada" }), { status: 200 })
}
