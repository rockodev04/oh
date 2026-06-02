import { describe, it, expect, beforeEach } from "bun:test"
import { sendMessage, getMessagesByReceiverId, messageDB } from "../../src/repositories/messageRepository"

describe("MessageRepository", () => {
  beforeEach(() => {
    messageDB.run("DELETE FROM messages")
  })

  it("debería enviar un mensaje", () => {
    const message = sendMessage({
      sender_id: 1,
      receiver_id: 2,
      content: "Hola",
      priority: 1
    })
    expect(message.content).toBe("Hola")
  })

  it("debería obtener mensajes ordenados por prioridad", () => {
    sendMessage({ sender_id: 3, receiver_id: 1, content: "Sin membresía", priority: 3 })
    sendMessage({ sender_id: 2, receiver_id: 1, content: "Gameboy", priority: 2 })
    sendMessage({ sender_id: 1, receiver_id: 1, content: "Playboy", priority: 1 })
    const messages = getMessagesByReceiverId(1)
    expect(messages[0]?.content).toBe("Playboy")
  })
})