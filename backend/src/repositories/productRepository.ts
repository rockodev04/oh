import sql from "../database"
import type { Product } from "../models/product"

export async function createProduct(product: Product): Promise<Product> {
  const result = await sql`
    INSERT INTO products (name, description, price, stock)
    VALUES (${product.name}, ${product.description}, ${product.price}, ${product.stock})
    RETURNING *
  `
  return result[0] as unknown as Product
}

export async function getAllProducts(): Promise<Product[]> {
  const result = await sql`SELECT * FROM products ORDER BY created_at DESC`
  return result as unknown as Product[]
}

export async function findProductById(id: number): Promise<Product | null> {
  const result = await sql`SELECT * FROM products WHERE id = ${id}`
  return result.length ? result[0] as unknown as Product : null
}

export async function deleteProductById(id: number): Promise<void> {
  await sql`DELETE FROM products WHERE id = ${id}`
}
