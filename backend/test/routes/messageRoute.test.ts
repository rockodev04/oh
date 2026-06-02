import { describe, it, expect, beforeEach } from "bun:test"
import { handleSendMessage, handleGetMessages } from "../../src/routes/messageRoutes"
import { generateToken } from "../../src/services/jwtService"
import { messageDB } from "../../src/repositories/messageRepository"

describe("MessageRoutes", () => {
  beforeEach(() => {
    messageDB.run("DELETE FROM messages")
  })

  it("debería retornar 401 sin token", async () => {
    const req = new Request("http://localhost/messages", { method: "POST" })
    const res = await handleSendMessage(req)
    expect(res.status).toBe(401)
  })

  it("debería enviar un mensaje con token válido", async () => {
    const token = await generateToken(1, "playboy")
    const req = new Request("http://localhost/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ receiver_id: 2, content: "Hola" })
    })
    const res = await handleSendMessage(req)
    expect(res.status).toBe(201)
  })

  it("debería obtener mensajes ordenados por prioridad", async () => {
    const token = await generateToken(1, "playboy")
    const req = new Request("http://localhost/messages", {
      headers: { "Authorization": `Bearer ${token}` }
    })
    const res = await handleGetMessages(req)
    expect(res.status).toBe(200)
  })
})