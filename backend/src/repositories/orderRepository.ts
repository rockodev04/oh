import { Database } from "bun:sqlite"
import type { Order } from "../models/order"

export const orderDB = new Database(process.env.DATABASE_URL || "magic.db")

orderDB.run(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total NUMBER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

export function createOrder(order: Order): Order {
  const insertOrder = orderDB.prepare(
    "INSERT INTO orders (user_id, total, status) VALUES ($user_id, $total, $status)"
  )
  const result = insertOrder.run({
    $user_id: order.user_id,
    $total: order.total,
    $status: order.status
  })
  return { ...order, id: result.lastInsertRowid as number }
}

export function findOrdersByUserId(user_id: number): Order[] {
  const findOrder = orderDB.prepare("SELECT * FROM orders WHERE user_id = ?")
  return findOrder.all(user_id) as Order[]
}

export function updateOrderStatus(user_id: number, status: "pending" | "completed" | "failed"): void {
  const updateOrder = orderDB.prepare("UPDATE orders SET status = ? WHERE user_id = ?")
  updateOrder.run(status, user_id)
}