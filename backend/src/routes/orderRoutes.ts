import { authenticate } from "../middleware/authMiddleware"
import { createOrder,findOrdersByUserId,orderDB } from "../repositories/orderRepository"
import { getCartByUserId,clearCart } from "../repositories/cartRepository"



export async function handleProcessOrder(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)

  if(!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

  
  const cart = getCartByUserId(payload.userId)
  if(cart.length === 0) return new Response(JSON.stringify({ error: "Cart is empty" }), { status: 400 })

const total = cart.reduce((sum, item) => sum + item.quantity, 0)
const order = createOrder({ user_id: payload.userId, total, status: "completed" })
clearCart(payload.userId)

return new Response(JSON.stringify(order), { status: 201 })
}

export async function handleGetOrders(req: Request): Promise<Response>{
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })
  
  const order = findOrdersByUserId(payload.userId)
  
  return new Response(JSON.stringify({ order: order }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
}