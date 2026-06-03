import { authenticate } from "../middleware/authMiddleware"
import { createArticle, getAllArticles, findArticleById, deleteArticleById } from "../repositories/articleRepository"
import { getUserRole } from "../repositories/userRepository"

export async function handleCreateArticle(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if (!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

  const role = await getUserRole(payload.userId)
  if (role !== 'staff' && role !== 'admin') {
    return new Response(JSON.stringify({ error: "Solo el staff puede crear artículos" }), { status: 403 })
  }

  const body = await req.json() as { title: string, contentType: "public" | "creator" | "tips", body: string }
  const article = await createArticle({
    title: body.title,
    contentType: body.contentType,
    body: body.body,
    created_by: payload.userId
  })

  return new Response(JSON.stringify(article), { status: 201 })
}

export async function handleGetArticles(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if (!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })

  const articles = await getAllArticles()
  return new Response(JSON.stringify({ articles }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
}

export async function handleDeleteArticle(req: Request, id: number): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if (!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })

  const article = await findArticleById(id)
  if (!article) {
    return new Response(JSON.stringify({ error: "Article not found" }), { status: 404 })
  }

  const role = await getUserRole(payload.userId)
  if (article.created_by !== payload.userId && role !== 'admin') {
    return new Response(JSON.stringify({ error: "Action not allowed" }), { status: 403 })
  }

  await deleteArticleById(id)
  return new Response(JSON.stringify({ message: "Article deleted successfully" }), { status: 200 })
}
