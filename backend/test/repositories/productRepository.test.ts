import { describe, it, expect, beforeEach } from "bun:test"
import { createProduct, getAllProducts, findProductById, productDb } from "../../src/repositories/productRepository"

describe("ProductRepository", () => {
  beforeEach(() => {
    productDb.run("DELETE FROM products")
  })

  it("debería crear un producto", () => {
    const product = createProduct({
      name: "Curso hacking",
      description: "Aprende hacking ético",
      price: 29.99,
      stock: 100
    })
    expect(product.name).toBe("Curso hacking")
  })

  it("debería listar todos los productos", () => {
    createProduct({ name: "Curso 1", description: "Desc 1", price: 9.99, stock: 10 })
    createProduct({ name: "Curso 2", description: "Desc 2", price: 19.99, stock: 20 })
    const products = getAllProducts()
    expect(products).toHaveLength(2)
  })

  it("debería encontrar un producto por id", () => {
    const product = createProduct({ name: "Curso hacking", description: "Desc", price: 29.99, stock: 100 })
    const found = findProductById(product.id!)
    expect(found?.name).toBe("Curso hacking")
  })
})