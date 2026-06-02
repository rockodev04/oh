export type Order = {
  id?: number
  user_id: number
  total: number
  status: "pending" | "completed" | "failed"
  created_at?: string
}

export type OrderItem = {
  id?: number
  order_id: number
  product_id: number
  quantity: number
  price: number
}