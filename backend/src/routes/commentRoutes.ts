import { authenticate } from "../middleware/authMiddleware"
import { createComment, getCommentsByArticleId, findCommentById, deleteCommentById, updateComment } from "../repositories/commentRepository"
import type { User } from "../models/user"

export async function handleCreateComment(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)

  if(!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

  if(payload.membership === "none") {
  return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 })
}

const body = await req.json() as { article_id: number, content: string }
const comment = createComment({ article_id: body.article_id, user_id: payload.userId, content: body.content })

return new Response(JSON.stringify(comment), { status: 201 })
}

export async function handleGetComments(req:Request, article_id: number):Promise <Response>{

  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })

  const comment = getCommentsByArticleId(article_id)

  return new Response(JSON.stringify({ comment: comment }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
}

export async function handleDeleteComment(req:Request,id:number):Promise <Response>{
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })

  const commentByid = findCommentById(id)
  if(!commentByid) {
    return new Response(JSON.stringify({ error: "Article not found" }), { status: 404 })
  }

  if(commentByid.user_id !== payload.userId){
    return new Response(JSON.stringify({ error: "Action not allowed" }), { status: 403 })
  }

  deleteCommentById(id)
  return new Response(JSON.stringify({ message: "Article deleted successfully" }), { status: 200 })

}

export async function handleUpdateComment(req:Request,id:number):Promise <Response>{
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  const body = await req.json() as { content: string }
  if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })

  const commentByid = findCommentById(id)
  if(!commentByid) {
    return new Response(JSON.stringify({ error: "Article not found" }), { status: 404 })
  }

  if(commentByid.user_id !== payload.userId){
    return new Response(JSON.stringify({ error: "Action not allowed" }), { status: 403 })
  }

  updateComment(id,body.content)
  return new Response(JSON.stringify({ message: "Article updated successfully" }), { status: 200 })
}
