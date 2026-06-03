import sql from "../database"
import type { Order } from "../models/order"


export async function createOrder(order: Order): Promise<Order> {
  const result = await sql`
    INSERT INTO orders (user_id, total, status)
    VALUES (${order.user_id}, ${order.total}, ${order.status})
    RETURNING *
  `
  return result[0] as unknown as Order
}

export async function findOrdersByUserId(user_id: number): Promise<Order[]> {
  const result = await sql`
    SELECT * FROM orders WHERE user_id = ${user_id} ORDER BY created_at DESC
  `
  return result as unknown as Order[]
}
