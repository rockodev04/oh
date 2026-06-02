import { authenticate } from "../middleware/authMiddleware"
import { createPayment } from "../repositories/paymentRepository"
import { updateUserMembership } from "../repositories/userRepository"

export async function handleCreatePayment(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)

  if(!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

  const body = await req.json() as { membership: "gameboy" | "playboy", amount: number }
  
  const payment = createPayment({
    user_id: payload.userId,
    membership: body.membership,
    amount: body.amount,
    status: "completed"
  })

  updateUserMembership(payload.userId, body.membership)

  return new Response(JSON.stringify(payment), { status: 201 })
}