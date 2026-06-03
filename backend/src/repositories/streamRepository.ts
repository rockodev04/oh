import sql from "../database"
import type { Stream } from "../models/stream"

export async function createStream(stream: Stream): Promise<Stream> {
  const result = await sql`
    INSERT INTO streams (host_id, title, status, membership_required)
    VALUES (${stream.host_id}, ${stream.title}, ${stream.status}, ${stream.membership_required})
    RETURNING *
  `
  return result[0] as unknown as Stream
}

export async function getAllStreams(): Promise<Stream[]> {
  const result = await sql`SELECT * FROM streams ORDER BY created_at DESC`
  return result as unknown as Stream[]
}

export async function getActiveStreams(): Promise<Stream[]> {
  const result = await sql`SELECT * FROM streams WHERE status = 'active'`
  return result as unknown as Stream[]
}

export async function findStreamById(id: number): Promise<Stream | null> {
  const result = await sql`SELECT * FROM streams WHERE id = ${id}`
  return result.length ? result[0] as unknown as Stream : null
}

export async function updateStreamStatus(id: number, status: "active" | "ended"): Promise<void> {
  await sql`UPDATE streams SET status = ${status} WHERE id = ${id}`
}

export async function deleteStreamById(id: number): Promise<void> {
  await sql`DELETE FROM streams WHERE id = ${id}`
}

export async function updateStream(id: number, title: string, membership_required: string): Promise<Stream | null> {
  const result = await sql`
    UPDATE streams
    SET title = ${title}, membership_required = ${membership_required}
    WHERE id = ${id}
    RETURNING *
  `
  return result.length ? result[0] as unknown as Stream : null
}
