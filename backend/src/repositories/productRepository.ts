import { Database } from "bun:sqlite"
export { productDb }
import type { Product } from "../models/product"

const productDb = new Database(process.env.DATABASE_URL || "magic.db")

productDb.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

export function createProduct(product: Product): Product {
  const newProduct = productDb.prepare(`
    INSERT INTO products (name, description, price, stock)
    VALUES ($name, $description, $price, $stock)
  `)
  const result = newProduct.run({
    $name: product.name,
    $description: product.description,
    $price: product.price,
    $stock: product.stock,
  })
  return { ...product, id: result.lastInsertRowid as number }
}

export function getAllProducts(): Product[] {
  const getProduct = productDb.prepare("SELECT * FROM products")
  return getProduct.all() as Product[]
}

export function findProductById(id: number): Product | null {
  const findProduct = productDb.prepare("SELECT * FROM products WHERE id = ?")
  return findProduct.get(id) as Product | null
}

export function deleteProductById(id: number): void {
  const deleteArticle = productDb.prepare("DELETE FROM products WHERE id = ?")
  deleteArticle.run(id)
}