import { authenticate } from "../middleware/authMiddleware"
import {sendMessage,getMessagesByUserId,findMessageById, deleteMessageById, updateMessage} from "../repositories/messageRepository"

export async function handleSendMessage(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)

  if(!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

  const priorityMap: Record<string, number> = {
    "playboy": 1,
    "gameboy": 2,
    "none": 3
  }
  const priority = priorityMap[payload.membership] ?? 3

  const body = await req.json() as { receiver_id: number, content: string }
  const message = sendMessage({ 
    sender_id: payload.userId, 
    receiver_id: body.receiver_id, 
    content: body.content,
    priority 
  })

  return new Response(JSON.stringify(message), { status: 201 })
}

export async function handleGetMessages(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })
  
  const messages = getMessagesByUserId(payload.userId)
  
  return new Response(JSON.stringify({ messages }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
}

export async function handleDeleteMessage(req:Request,id:number):Promise <Response>{
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })
  
  const messageId = findMessageById(id)
  if(!messageId) {
    return new Response(JSON.stringify({ error: "Message not found" }), { status: 404 })
  }

  if(messageId.sender_id !== payload.userId){
    return new Response(JSON.stringify({ error: "Action not allowed" }), { status: 403 })
  }

  deleteMessageById(id)
  return new Response(JSON.stringify({ message: "Message deleted successfully" }), { status: 200 })

}

export async function handleUpdateMessage(req:Request,id:number):Promise <Response>{
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]
  const payload = await authenticate(token)
  const body = await req.json() as { content: string }
  if(!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })
  
  const messageId = findMessageById(id)
  if(!messageId) {
    return new Response(JSON.stringify({ error: "Message not found" }), { status: 404 })
  }

  if(messageId.sender_id !== payload.userId){
    return new Response(JSON.stringify({ error: "Action not allowed" }), { status: 403 })
  }

  updateMessage(id,body.content)
  return new Response(JSON.stringify({ message: "Message updated successfully" }), { status: 200 })
}