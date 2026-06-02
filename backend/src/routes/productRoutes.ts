import { authenticate } from "../middleware/authMiddleware"
import {createProduct,deleteProductById,findProductById,getAllProducts} from "../repositories/productRepository"

export async function handleCreateProduct(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  
  if(!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  
  const body = await req.json() as { name: string, description: string, price: number, stock: number }
  const product = createProduct({ 
    name: body.name,
    description: body.description,
    price: body.price,
    stock: body.stock
  })

  return new Response(JSON.stringify(product), { status: 201 })
}

export async function handleGetProducts(req:Request):Promise <Response>{

  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })
  
  const product = getAllProducts()
  
  return new Response(JSON.stringify({ products: product }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
}

export async function handleDeleteProducts(req:Request,id:number):Promise <Response>{
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })
  
  const productByid = findProductById(id)
  if(!productByid) {
    return new Response(JSON.stringify({ error: "Product not found" }), { status: 404 })
  }

  deleteProductById(id)
  return new Response(JSON.stringify({ message: "Product deleted successfully" }), { status: 200 })

}