import { Database } from "bun:sqlite"
import type { Comment } from "../models/comment"


export const commentDB = new Database(process.env.DATABASE_URL || "magic.db")

commentDB.run(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

export function createComment(comment: Comment): Comment {
  if(!comment.article_id || !comment.user_id || !comment.content) {
    throw new Error("Invalid comment data")
  }
  const insertComment = commentDB.prepare(
    "INSERT INTO comments (article_id, user_id, content) VALUES ($article_id, $user_id, $content)"
  )
  const result = insertComment.run({
    $article_id: comment.article_id,
    $user_id: comment.user_id,
    $content: comment.content
  })
  return { ...comment, id: result.lastInsertRowid as number }
}

export function getCommentsByArticleId(article_id: number): Comment[] {
  const getComments = commentDB.prepare("SELECT * FROM comments WHERE article_id = ?")
  return getComments.all(article_id) as Comment[]
}

export function findCommentById(id: number): Comment | null {
  const findComment = commentDB.prepare("SELECT * FROM comments WHERE id = ?")
  return findComment.get(id) as Comment | null
}

export function deleteCommentById(id: number): void {
  const deleteComment = commentDB.prepare("DELETE FROM comments WHERE id = ?")
  deleteComment.run(id)
}

export function updateComment(id: number, content: string): Comment | null {
  const updatedComment = commentDB.prepare("UPDATE comments SET content = ? WHERE id = ?")
  updatedComment.run(content,id)
  return findCommentById(id)
}