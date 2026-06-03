import sql from "../database"
import type { Payment } from "../models/payment"

export async function createPayment(payment: Payment): Promise<Payment> {
  const result = await sql`
    INSERT INTO payments (user_id, membership, amount, status)
    VALUES (${payment.user_id}, ${payment.membership}, ${payment.amount}, ${payment.status})
    RETURNING *
  `
  return result[0] as unknown as Payment
}

export async function findPaymentsByUserId(user_id: number): Promise<Payment[]> {
  const result = await sql`SELECT * FROM payments WHERE user_id = ${user_id}`
  return result as unknown as Payment[]
}

export async function updatePaymentStatus(user_id: number, status: string): Promise<void> {
  await sql`UPDATE payments SET status = ${status} WHERE user_id = ${user_id}`
}
