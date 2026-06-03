import sql from "../database"
import type { Comment } from "../models/comment"

export async function createComment(comment: Comment): Promise<Comment> {
  const result = await sql`
    INSERT INTO comments (article_id, user_id, content)
    VALUES (${comment.article_id}, ${comment.user_id}, ${comment.content})
    RETURNING *
  `
  return result[0] as unknown as Comment
}

export async function getCommentsByArticleId(article_id: number): Promise<Comment[]> {
  const result = await sql`
    SELECT c.*, u.username AS sender_username
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.article_id = ${article_id}
    ORDER BY c.created_at ASC
  `
  return result as unknown as Comment[]
}

export async function findCommentById(id: number): Promise<Comment | null> {
  const result = await sql`SELECT * FROM comments WHERE id = ${id}`
  return result.length ? result[0] as unknown as Comment : null
}

export async function updateComment(id: number, content: string): Promise<Comment | null> {
  await sql`UPDATE comments SET content = ${content} WHERE id = ${id}`
  return findCommentById(id)
}

export async function deleteCommentById(id: number): Promise<void> {
  await sql`DELETE FROM comments WHERE id = ${id}`
}
