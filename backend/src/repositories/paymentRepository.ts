import { Database } from "bun:sqlite"
import type { Payment } from "../models/payment"

export const paymentDB = new Database(process.env.DATABASE_URL || "magic.db")

paymentDB.run(`
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    membership TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

export function createPayment(payment: Payment): Payment {
  const insertPayment = paymentDB.prepare(
    "INSERT INTO payments (user_id, membership, amount, status) VALUES ($user_id, $membership, $amount, $status)"
  )
  const result = insertPayment.run({
    $user_id: payment.user_id,
    $membership: payment.membership,
    $amount: payment.amount,
    $status: payment.status
  })
  return { ...payment, id: result.lastInsertRowid as number }
}

export function findPaymentsByUserId(user_id: number): Payment[] {
  const findPayment = paymentDB.prepare("SELECT * FROM payments WHERE user_id = ?")
  return findPayment.all(user_id) as Payment[]
}

export function updatePaymentStatus(user_id: number, status: "pending" | "completed" | "failed"): void {
  const updatePayment = paymentDB.prepare("UPDATE payments SET status = ? WHERE user_id = ?")
  updatePayment.run(status, user_id)
}