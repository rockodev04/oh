import sql from "../database"
import type { Like } from "../models/like"

export async function addLike(like: Like): Promise<Like> {
  const result = await sql`
    INSERT INTO likes (article_id, user_id)
    VALUES (${like.article_id}, ${like.user_id})
    ON CONFLICT (article_id, user_id) DO NOTHING
    RETURNING *
  `
  return result.length ? result[0] as unknown as Like : like
}

export async function removeLike(article_id: number, user_id: number): Promise<void> {
  await sql`DELETE FROM likes WHERE article_id = ${article_id} AND user_id = ${user_id}`
}

export async function getLikesByArticleId(article_id: number): Promise<Like[]> {
  const result = await sql`SELECT * FROM likes WHERE article_id = ${article_id}`
  return result as unknown as Like[]
}

export async function hasUserLiked(article_id: number, user_id: number): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM likes WHERE article_id = ${article_id} AND user_id = ${user_id}
  `
  return result.length > 0
}

export async function countLikesByArticleId(article_id: number): Promise<number> {
  const result = await sql`SELECT COUNT(*) AS total FROM likes WHERE article_id = ${article_id}`
  return parseInt(result[0]?.total)
}
