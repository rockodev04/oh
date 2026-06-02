import { describe, it, expect, beforeEach } from "bun:test"
import { createArticle, getAllArticles, articleDb } from "../../src/repositories/articleRepository"

describe("ArticleRepository", () => {
  beforeEach(() => {
    articleDb.run("DELETE FROM articles")
  })

  it("debería crear un artículo", () => {
    const article = createArticle({
      title: "Intro hacking",
      contentType: "public",
      body: "Contenido público"
    })
    expect(article.title).toBe("Intro hacking")
  })

  it("debería retornar todos los artículos", () => {
    createArticle({ title: "Intro hacking", contentType: "public", body: "Contenido público" })
    createArticle({ title: "Tips avanzados", contentType: "creator", body: "Contenido creator" })
    const articles = getAllArticles()
    expect(articles).toHaveLength(2)
  })

  
})