import { authenticate } from "../middleware/authMiddleware"
import {addLike,removeLike,getLikesByArticleId,hasUserLiked,countLikesByArticleId} from "../repositories/likeRepository"

export async function handleAddLike(req: Request, article_id: number): Promise<Response>{
  const authHeader = req.headers.get("Authorization")
    const token = authHeader?.split(" ")[1]
    const payload = await authenticate(token)
    
    if(!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    
    if(payload.membership === "none") {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 })
  }
  
  const like = addLike({ article_id, user_id: payload.userId })
  
  return new Response(JSON.stringify(like), { status: 201 })
}

export async function handleRemoveLike(req: Request, article_id: number): Promise<Response>{
  const authHeader = req.headers.get("Authorization")
    const token = authHeader?.split(" ")[1]
    const payload = await authenticate(token)
    if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })
    
    removeLike(article_id, payload.userId)
    return new Response(JSON.stringify({ message: "Like removed successfully" }), { status: 200 })
}

export async function handleCountLikes(req: Request, article_id: number): Promise<Response>{
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })
  
  const like = countLikesByArticleId(article_id)
  
  return new Response(JSON.stringify({ like: like }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
}