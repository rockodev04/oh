import { Database } from "bun:sqlite"
export { articleDb }
import type { Article } from "../models/article"

const articleDb = new Database(process.env.DATABASE_URL || "magic.db")

articleDb.run(`
  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    contentType TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER
  )
`)

export function createArticle(article: Article): Article {
  const newArticle = articleDb.prepare(`
    INSERT INTO articles (title, contentType, body, created_by)
    VALUES ($title, $contentType, $body, $created_by)
  `)
  const result = newArticle.run({
    $title: article.title,
    $contentType: article.contentType,
    $body: article.body,
    $created_by: article.created_by ?? null
  })
  return { ...article, id: result.lastInsertRowid as number }
}

export function getAllArticles(): Article[] {
  const getArticles = articleDb.prepare("SELECT * FROM articles")
  return getArticles.all() as Article[]
}

export function findArticleById(id: number): Article | null {
  const findArticle = articleDb.prepare("SELECT * FROM articles WHERE id = ?")
  return findArticle.get(id) as Article | null
}

export function deleteArticleById(id: number): void {
  const deleteArticle = articleDb.prepare("DELETE FROM articles WHERE id = ?")
  deleteArticle.run(id)
}