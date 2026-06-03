import sql from "../database"
import type {Article} from "../models/article"



export async function createArticle(article: Article): Promise<Article> {
  const result = await sql`
    INSERT INTO articles (title, content_type, body, created_by)
    VALUES (${article.title}, ${article.contentType}, ${article.body}, ${article.created_by ?? null})
    RETURNING id, title, content_type AS "contentType", body, created_by, created_at
  `
  return result[0] as Article
}

export async function getAllArticles(): Promise<Article[]> {
  const result = await sql`
    SELECT id, title, content_type AS "contentType", body, created_by, created_at
    FROM articles ORDER BY created_at DESC
  `
  return [...result] as Article[]
}

export async function findArticleById(id: number): Promise<Article | null> {
  const result = await sql`
    SELECT id, title, content_type AS "contentType", body, created_by, created_at
    FROM articles WHERE id = ${id}
  `
  return result.length ? result[0] as unknown as Article : null
}

export async function deleteArticleById(id: number): Promise<void> {
  await sql`DELETE FROM articles WHERE id = ${id}`
}
