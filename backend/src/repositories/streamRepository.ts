import { Database } from "bun:sqlite"
export { streamDB }
import type { Stream } from "../models/stream"

const streamDB = new Database(process.env.DATABASE_URL || "magic.db")

streamDB.run(`
  CREATE TABLE IF NOT EXISTS streams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    host_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    membership_required TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

export function createStream(stream: Stream): Stream {
  const newStream = streamDB.prepare(`
  INSERT INTO streams (title, host_id, status, membership_required)
VALUES ($title, $host_id, $status, $membership_required)
  `)
  const result = newStream.run({
    $title: stream.title,
    $membership_required: stream.membership_required,
    $host_id: stream.host_id,
    $status: stream.status
  })
  return { ...stream, id: result.lastInsertRowid as number }
}

export function getAllStreams(): Stream[] {
  const getStream = streamDB.prepare("SELECT * FROM streams")
  return getStream.all() as Stream[]
}

export function getActiveStreams(): Stream[] {
  const streamActive = streamDB.prepare("SELECT * FROM streams WHERE status = 'active'")
  return streamActive.all() as Stream[]
}

export function findStreamById(id: number): Stream | null {
  const findStream = streamDB.prepare("SELECT * FROM streams WHERE id = ?")
  return findStream.get(id) as Stream | null
}

export function updateStreamStatus(id: number, status: "active" | "ended"): void {
  const updatedStream = streamDB.prepare("UPDATE streams SET status = ? WHERE id = ?")
  updatedStream.run(status, id)
}

export function deleteStreamById(id: number): void {
  const deleteStream = streamDB.prepare("DELETE FROM streams WHERE id = ?")
  deleteStream.run(id)
}