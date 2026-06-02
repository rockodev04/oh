export type Message = {
  id?: number
  sender_id: number
  receiver_id: number
  content: string
  priority?: number
  created_at?: string
  sender_username?: string
}