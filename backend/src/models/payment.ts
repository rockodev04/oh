export type Payment = {
  id?: number
  user_id: number
  membership: "gameboy" | "playboy"
  amount: number
  status: "pending" | "completed" | "failed"
  created_at?: string
}