import sql from "../database"
import { encrypt, decrypt } from "../database"
import type { Message } from "../models/message"

export async function sendMessage(message: Message): Promise<Message> {
  const encryptedContent = await encrypt(message.content)
  const result = await sql`
    INSERT INTO messages (sender_id, receiver_id, content, priority)
    VALUES (${message.sender_id}, ${message.receiver_id}, ${encryptedContent}, ${message.priority ?? 3})
    RETURNING id, sender_id, receiver_id, content, priority, created_at
  `
  const row = result[0] as Message
  return {
    ...row,
    content: await decrypt(row.content)
  }
}

export async function getMessagesByUserId(user_id: number): Promise<Message[]> {
  const result = await sql`
    SELECT m.id, m.sender_id, m.receiver_id, m.content, m.priority, m.created_at,
           u.username AS sender_username
    FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.sender_id = ${user_id} OR m.receiver_id = ${user_id}
    ORDER BY m.priority ASC, m.created_at ASC
  `
  return Promise.all(result.map(async (m: any) => ({
    ...m,
    content: await decrypt(m.content)
  })))
}

export async function findMessageById(id: number): Promise<Message | null> {
  const result = await sql`SELECT * FROM messages WHERE id = ${id}`
  if (!result.length) return null
  return {
    ...result[0],
    content: await decrypt(result[0]?.content)
  } as unknown as Message
}

export async function updateMessage(id: number, content: string): Promise<Message | null> {
  const encryptedContent = await encrypt(content)
  await sql`UPDATE messages SET content = ${encryptedContent} WHERE id = ${id}`
  return findMessageById(id)
}

export async function deleteMessageById(id: number): Promise<void> {
  await sql`DELETE FROM messages WHERE id = ${id}`
}
