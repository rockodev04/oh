import { authenticate } from "../middleware/authMiddleware"
import { createProduct, deleteProductById, findProductById, getAllProducts, updateProduct } from "../repositories/productRepository"
import { getUserRole } from "../repositories/userRepository"

export async function handleCreateProduct(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if (!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

  // ✅ Solo staff o admin puede crear productos
  const role = await getUserRole(payload.userId)
  if (role !== 'staff' && role !== 'admin') {
    return new Response(JSON.stringify({ error: "Solo el staff puede crear productos" }), { status: 403 })
  }

  const body = await req.json() as { name: string, description: string, price: number, stock: number }
  const product = await createProduct({  // ✅ await
    name: body.name,
    description: body.description,
    price: body.price,
    stock: body.stock
  })

  return new Response(JSON.stringify(product), { status: 201 })
}

export async function handleGetProducts(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if (!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })

  const products = await getAllProducts()  // ✅ await

  return new Response(JSON.stringify({ products }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
}

export async function handleUpdateProduct(req: Request, id: number): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if (!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

  const role = await getUserRole(payload.userId)
  if (role !== 'staff' && role !== 'admin') {
    return new Response(JSON.stringify({ error: "Solo el staff puede editar productos" }), { status: 403 })
  }

  const product = await findProductById(id)
  if (!product) return new Response(JSON.stringify({ error: "Product not found" }), { status: 404 })

  const body = await req.json() as { name: string, description: string, price: number, stock: number }
  const updated = await updateProduct(id, body)

  return new Response(JSON.stringify(updated), { status: 200 })
}

export async function handleDeleteProducts(req: Request, id: number): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if (!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })

  // ✅ Solo staff o admin puede eliminar productos
  const role = await getUserRole(payload.userId)
  if (role !== 'staff' && role !== 'admin') {
    return new Response(JSON.stringify({ error: "Solo el staff puede eliminar productos" }), { status: 403 })
  }

  const product = await findProductById(id)  // ✅ await
  if (!product) {
    return new Response(JSON.stringify({ error: "Product not found" }), { status: 404 })
  }

  await deleteProductById(id)  // ✅ await
  return new Response(JSON.stringify({ message: "Product deleted successfully" }), { status: 200 })
}
