import { authenticate } from "../middleware/authMiddleware"
import {addToCart,removeFromCart,getCartByUserId} from "../repositories/cartRepository"

export async function handleAddToCart(req: Request): Promise<Response>{
  const authHeader = req.headers.get("Authorization")
    const token = authHeader?.split(" ")[1]
    const payload = await authenticate(token)
    
    if(!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    
    const body = await req.json() as { product_id: number, quantity: number }
    const cart = addToCart({ product_id: body.product_id, user_id: payload.userId, quantity: body.quantity })
  
    return new Response(JSON.stringify(cart), { status: 201 })
  }
  
  

export async function handleRemoveFromCart(req: Request, id: number): Promise<Response>{
  const authHeader = req.headers.get("Authorization")
    const token = authHeader?.split(" ")[1]
    const payload = await authenticate(token)
    if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })
    
    removeFromCart(id)
    return new Response(JSON.stringify({ message: "Cart removed successfully" }), { status: 200 })
}

export async function handleGetCart(req: Request): Promise<Response>{
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })
  
  const cart = getCartByUserId(payload.userId)
  
  return new Response(JSON.stringify({ cart: cart }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
}