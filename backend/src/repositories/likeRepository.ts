import { Database } from "bun:sqlite"
import type { Like } from "../models/like"

export const likesDB = new Database(process.env.DATABASE_URL || "magic.db")

likesDB.run(`
  CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, user_id)
  )
`)


export function addLike(like: Like): Like {
  const addnewLike = likesDB.prepare(
    "INSERT OR IGNORE INTO likes (article_id, user_id) VALUES (?, ?)"
  )
  const result = addnewLike.run(like.article_id, like.user_id)
  return { ...like, id: result.lastInsertRowid as number }
}

export function removeLike(article_id: number, user_id: number): void{
  const deleteLike = likesDB.prepare("DELETE FROM likes WHERE article_id = ? AND user_id = ?")
    deleteLike.run(article_id,user_id)
}

export function getLikesByArticleId(article_id: number): Like[]{
  const getLikes = likesDB.prepare("SELECT * FROM likes WHERE article_id = ?")
    return getLikes.all(article_id) as Like[]
}

export function hasUserLiked(article_id: number, user_id: number): boolean{
  const hasLiked = likesDB.prepare("SELECT 1 FROM likes WHERE article_id = ? AND user_id = ?")
  return !!hasLiked.get(article_id, user_id)
}

export function countLikesByArticleId(article_id: number): number{
  const counterlike = likesDB.prepare("SELECT COUNT(*) as total FROM likes WHERE article_id = ?")
  const getlikes = counterlike.get(article_id) as { total: number }
  return getlikes.total
}
