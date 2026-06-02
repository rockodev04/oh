import { Database } from "bun:sqlite"
import type { CartItem } from "../models/cart"

export const cartDb = new Database(process.env.DATABASE_URL || "magic.db")

cartDb.run(`
  CREATE TABLE IF NOT EXISTS carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
  )
`)


export function addToCart(cart: CartItem): CartItem {
  const addNewCart = cartDb.prepare(
    "INSERT OR IGNORE INTO carts (product_id, user_id,quantity) VALUES (?, ?,?)"
  )
  const result = addNewCart.run(cart.product_id, cart.user_id, cart.quantity)
  return { ...cart, id: result.lastInsertRowid as number }
}

export function getCartByUserId(user_id: number): CartItem[] {
  const getProducts = cartDb.prepare("SELECT * FROM carts WHERE user_id = ?")
  return getProducts.all(user_id) as CartItem[]
}

export function removeFromCart(id: number): void {
  const deleteCart = cartDb.prepare("DELETE FROM carts WHERE id = ?")
  deleteCart.run(id)
}

export function clearCart(user_id: number): void {
  const cleanedCart = cartDb.prepare("DELETE FROM carts WHERE user_id = ?")
  cleanedCart.run(user_id)
}
