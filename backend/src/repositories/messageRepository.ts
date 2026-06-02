import { Database } from "bun:sqlite"
import type { Message } from "../models/message"

export const messageDB = new Database(process.env.DATABASE_URL || "magic.db")

messageDB.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    priority INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

export function sendMessage(message: Message): Message {
  if(!message.sender_id || !message.receiver_id || !message.content) {
    throw new Error("Invalid message")
  }
  const insertNewMessage = messageDB.prepare(
  "INSERT INTO messages (sender_id, receiver_id, content, priority) VALUES ($sender_id, $receiver_id, $content, $priority)"
)
const result = insertNewMessage.run({
  $sender_id: message.sender_id,
  $receiver_id: message.receiver_id,
  $content: message.content,
  $priority: message.priority ?? 3
})
  return { ...message, id: result.lastInsertRowid as number }
}

export function getMessagesByUserId(user_id: number): Message[] {
  const getMessages = messageDB.prepare(`
    SELECT m.*, u.username as sender_username 
    FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.sender_id = ? OR m.receiver_id = ? 
    ORDER BY m.priority ASC, m.created_at ASC
  `)
  return getMessages.all(user_id, user_id) as Message[]
}

export function findMessageById(id: number): Message | null {
  const findMessage = messageDB.prepare("SELECT * FROM messages WHERE id = ?")
  return findMessage.get(id) as Message | null
}

export function deleteMessageById(id: number): void {
  const deleteMessage = messageDB.prepare("DELETE FROM messages WHERE id = ?")
  deleteMessage.run(id)
}

export function updateMessage(id: number, content: string): Message | null {
  const updatedMessage = messageDB.prepare("UPDATE messages SET content = ? WHERE id = ?")
  updatedMessage.run(content,id)
  return findMessageById(id)
}