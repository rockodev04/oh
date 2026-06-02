import { describe, it, expect, beforeEach } from "bun:test"
import { handleCreateArticle, handleGetArticles,handleDeleteArticle } from "../../src/routes/articleRoutes"
import { generateToken } from "../../src/services/jwtService"
import { db } from "../../src/repositories/userRepository"
import { createArticle, articleDb } from "../../src/repositories/articleRepository"

describe("ArticleRoutes", () => {
  beforeEach(() => {
  articleDb.run("DELETE FROM articles")
  db.run("DELETE FROM users")
})

  it("debería retornar 401 sin token", async () => {
    const req = new Request("http://localhost/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Intro hacking",
        contentType: "public",
        body: "Contenido público"
      })
    })
    const res = await handleCreateArticle(req)
    expect(res.status).toBe(401)
  })

  it("debería retornar 403 si la membresía es none", async () => {
  const token = await generateToken(1, "none")
  const req = new Request("http://localhost/articles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      title: "Intro hacking",
      contentType: "public",
      body: "Contenido público"
    })
  })
  const res = await handleCreateArticle(req)
  expect(res.status).toBe(403)
})

it("debería crear un artículo con membresía gameboy", async () => {
  const token = await generateToken(1, "gameboy")
  const req = new Request("http://localhost/articles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      title: "Intro hacking",
      contentType: "public",
      body: "Contenido público"
    })
  })
  const res = await handleCreateArticle(req)
  expect(res.status).toBe(201)
})

it("debería retornar todos los artículos con token válido", async () => {
  const token = await generateToken(1, "gameboy")
  const req = new Request("http://localhost/articles", {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const res = await handleGetArticles(req)
  expect(res.status).toBe(200)
})

it("debería eliminar un artículo si es el creador", async () => {
  const token = await generateToken(1, "gameboy")
  const article = createArticle({
    title: "Intro hacking",
    contentType: "public",
    body: "Contenido público",
    created_by: 1
  })
  const req = new Request("http://localhost/articles/1", {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  })
  const res = await handleDeleteArticle(req, article.id!)
  expect(res.status).toBe(200)
})

it("debería retornar 403 si no es el creador", async () => {
  const token = await generateToken(2, "gameboy")
  const article = createArticle({
    title: "Intro hacking",
    contentType: "public",
    body: "Contenido público",
    created_by: 1
  })
  const req = new Request("http://localhost/articles/1", {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  })
  const res = await handleDeleteArticle(req, article.id!)
  expect(res.status).toBe(403)
})
})