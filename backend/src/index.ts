import { blacklistMiddleware } from "./middleware/blacklistMiddleware"
import { honeypotMiddleware } from "./middleware/honeypotMiddleware"
import { rateLimitMiddleware } from "./middleware/rateLimitMiddleware"
import { handleRegister, handleLogin } from "./routes/authRoutes"
import { handleMe, handleContent } from "./routes/contentRoutes"
import { handleCreateArticle, handleGetArticles, handleDeleteArticle } from "./routes/articleRoutes"
import { handleAssignMembership, handleGetMembership, handleCancelMembership } from "./routes/membershipRoutes"
import { handleCreateComment, handleGetComments, handleDeleteComment, handleUpdateComment } from "./routes/commentRoutes"
import { handleAddLike, handleRemoveLike, handleCountLikes } from "./routes/likeRoutes"
import { handleCreatePayment } from "./routes/paymentRoutes"
import { handleGetProducts, handleCreateProduct } from "./routes/productRoutes"
import { handleAddToCart, handleGetCart, handleRemoveFromCart } from "./routes/cartRoutes"
import { handleProcessOrder, handleGetOrders } from "./routes/orderRoutes"
import { handleSendMessage, handleGetMessages, handleDeleteMessage, handleUpdateMessage } from "./routes/messageRoutes"
import { handleCreateStream, handleJoinStream, handleGetActiveStreams, handleEndStream } from "./routes/streamRoutes"
import { handleUpdateUsername, handleChangePassword } from "./routes/profileRoutes"
import { handleGetUsers, handleUpdateUserRole, handleGetStats, handleDeleteUser } from "./routes/adminRoutes"


const PORT = 3001

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

function addCors(res: Response): Response {
  const headers = new Headers(res.headers)
  Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v))
  return new Response(res.body, { status: res.status, headers })
}

async function handleRoute(req: Request, url: URL): Promise<Response> {
  const method = req.method
  const path = url.pathname
  const segments = path.split("/").filter(Boolean)

  // Auth
  if (path === "/auth/register" && method === "POST") return handleRegister(req)
  if (path === "/auth/login" && method === "POST") return handleLogin(req)

  // Me
  if (path === "/me" && method === "GET") return handleMe(req)
  
  //Update nickname and password
  if (path === "/profile/username" && method === "PATCH") return handleUpdateUsername(req)
  if (path === "/profile/password" && method === "PATCH") return handleChangePassword(req)

  // Content
  if (path === "/content" && method === "GET") return handleContent(req)

  // Articles
  if (path === "/articles" && method === "GET") return handleGetArticles(req)
  if (path === "/articles" && method === "POST") return handleCreateArticle(req)
  if (segments[0] === "articles" && segments[1] && method === "DELETE") {
    return handleDeleteArticle(req, parseInt(segments[1]))
  }

  // Comments
  if (path === "/comments" && method === "POST") return handleCreateComment(req)
  if (segments[0] === "comments" && segments[1] && method === "GET") {
    return handleGetComments(req, parseInt(segments[1]))
  }
  if (segments[0] === "comments" && segments[1] && method === "DELETE") {
    return handleDeleteComment(req, parseInt(segments[1]))
  }
  if (segments[0] === "comments" && segments[1] && method === "PATCH") {
    return handleUpdateComment(req, parseInt(segments[1]))
  }

  // Likes
  if (segments[0] === "likes" && segments[1] && method === "POST") {
    return handleAddLike(req, parseInt(segments[1]))
  }
  if (segments[0] === "likes" && segments[1] && method === "DELETE") {
    return handleRemoveLike(req, parseInt(segments[1]))
  }
  if (segments[0] === "likes" && segments[1] && segments[2] === "count" && method === "GET") {
    return handleCountLikes(req, parseInt(segments[1]))
  }

  // Membership
  if (path === "/membership" && method === "POST") return handleAssignMembership(req)
  if (path === "/membership" && method === "GET") return handleGetMembership(req)
  if (path === "/membership" && method === "DELETE") return handleCancelMembership(req)

  // Payments
  if (path === "/payments" && method === "POST") return handleCreatePayment(req)

  // Products
  if (path === "/products" && method === "GET") return handleGetProducts(req)
  if (path === "/products" && method === "POST") return handleCreateProduct(req)

  // Cart
  if (path === "/cart" && method === "POST") return handleAddToCart(req)
  if (path === "/cart" && method === "GET") return handleGetCart(req)
  if (segments[0] === "cart" && segments[1] && method === "DELETE") {
    return handleRemoveFromCart(req, parseInt(segments[1]))
  }

  // Orders
  if (path === "/orders" && method === "POST") return handleProcessOrder(req)
  if (path === "/orders" && method === "GET") return handleGetOrders(req)

  // Messages
  if (path === "/messages" && method === "POST") return handleSendMessage(req)
  if (path === "/messages" && method === "GET") return handleGetMessages(req)
  if (segments[0] === "messages" && segments[1] && method === "DELETE") {
    return handleDeleteMessage(req, parseInt(segments[1]))
  }
  if (segments[0] === "messages" && segments[1] && method === "PATCH") {
    return handleUpdateMessage(req, parseInt(segments[1]))
  }

  // Streams
  if (path === "/streams" && method === "POST") return handleCreateStream(req)
  if (path === "/streams/active" && method === "GET") return handleGetActiveStreams(req)
  if (segments[0] === "streams" && segments[1] && segments[2] === "join" && method === "GET") {
    return handleJoinStream(req, parseInt(segments[1]))
  }
  if (segments[0] === "streams" && segments[1] && segments[2] === "end" && method === "PATCH") {
    return handleEndStream(req, parseInt(segments[1]))
  }

  // Admin
  if (path === "/admin/stats" && method === "GET") return handleGetStats(req)
  if (path === "/admin/users" && method === "GET") return handleGetUsers(req)
  if (segments[0] === "admin" && segments[1] === "users" && segments[3] === "role" && method === "PATCH") {
    return handleUpdateUserRole(req, parseInt(segments[2] ?? '0'))
  }
  if (segments[0] === "admin" && segments[1] === "users" && segments[2] && !segments[3] && method === "DELETE") {
    return handleDeleteUser(req, parseInt(segments[2] ?? '0'))
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" }
  })
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    const blacklisted = await blacklistMiddleware(req)
    if (blacklisted) return addCors(blacklisted)

    const honeypot = await honeypotMiddleware(req)
    if (honeypot) return addCors(honeypot)

    const rateLimit = await rateLimitMiddleware(req)
    if (rateLimit) return addCors(rateLimit)

    const res = await handleRoute(req, url)
    return addCors(res)
  }
})

console.log(`🚀 Magic Backend running at http://localhost:${PORT}`)

const peers = new Map<string, any>()

Bun.serve({
  port: 3002,
  websocket: {
    message(ws, message) {
      const data = JSON.parse(message as string)
      
      switch(data.type) {
        case 'join':
          ws.subscribe(data.streamId)
          ws.publish(data.streamId, JSON.stringify({ type: 'user-joined', userId: data.userId }))
          break
        case 'offer':
        case 'answer':
        case 'ice-candidate':
          ws.publish(data.streamId, JSON.stringify(data))
          break
        case 'leave':
          ws.unsubscribe(data.streamId)
          break
      }
    },
    open(ws) {
      console.log('WebSocket connected')
    },
    close(ws) {
      console.log('WebSocket disconnected')
    }
  },
  fetch(req, server) {
    if (server.upgrade(req)) return
    return new Response('WebSocket only', { status: 400 })
  }
})

console.log('📡 Signaling server running at ws://localhost:3002')