import { findPaymentsByUserId, updatePaymentStatus } from "../repositories/paymentRepository" 
import { updateUserMembership } from "../repositories/userRepository"

export function isMembershipActive(user_id: number): boolean {
  const payments = findPaymentsByUserId(user_id)
  return payments.some(payment => payment.status === "completed")
}

export function cancelMembership(user_id: number): void{
  updatePaymentStatus(user_id, "failed")
  updateUserMembership(user_id, "none")
}