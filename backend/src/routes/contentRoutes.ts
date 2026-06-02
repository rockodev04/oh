import { authenticate } from "../middleware/authMiddleware"
import { getAllArticles } from "../repositories/articleRepository"
import { filterContent } from "../services/contentService"

export async function handleMe(req: Request): Promise<Response>{
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })
  return new Response(JSON.stringify({ userId: payload.userId }), { status: 200 })
}

export async function handleContent(req: Request): Promise<Response>{
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })
  
  const articles = getAllArticles()
  const filtered = filterContent(payload.membership, articles)
  
  return new Response(JSON.stringify({ articles: filtered }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
}

