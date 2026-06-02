import type { Article } from "../models/article"

export function filterContent(membership: string, articles: Article[]): Article[] {
  const ACCESS_LEVELS: Record<string, string[]> = {
    "none": ["public"],
    "gameboy": ["public", "creator"],
    "playboy": ["public", "creator", "tips"]
  }
  
  const allowed = ACCESS_LEVELS[membership] ?? ["public"]
  return articles.filter(article => allowed.includes(article.contentType))
}