import sql from "../database"
import type { CartItem } from "../models/cart"

export async function addToCart(cart: CartItem): Promise<CartItem> {
  const result = await sql`
    INSERT INTO carts (user_id, product_id, quantity)
    VALUES (${cart.user_id}, ${cart.product_id}, ${cart.quantity})
    ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = carts.quantity + ${cart.quantity}
    RETURNING *
  `
  return result[0] as unknown as CartItem
}

export async function removeFromCart(id: number): Promise<void> {
  await sql`DELETE FROM carts WHERE id = ${id}`
}

export async function getCartByUserId(user_id: number): Promise<CartItem[]> {
  const result = await sql`SELECT * FROM carts WHERE user_id = ${user_id}`
  return result as unknown as CartItem[]
}

export async function clearCart(user_id: number): Promise<void> {
  await sql`DELETE FROM carts WHERE user_id = ${user_id}`
}
