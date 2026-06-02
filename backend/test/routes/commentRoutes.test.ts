import { describe, it, expect, beforeEach } from "bun:test"
import { handleCreateComment, handleGetComments, handleDeleteComment, handleUpdateComment } from "../../src/routes/commentRoutes"
import { createComment } from "../../src/repositories/commentRepository"
import { generateToken } from "../../src/services/jwtService"
import { commentDB } from "../../src/repositories/commentRepository"

describe("CommentRoutes", () => {
  beforeEach(() => {
    commentDB.run("DELETE FROM comments")
  })

  it("debería retornar 401 sin token", async () => {
    const req = new Request("http://localhost/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ article_id: 1, content: "Buen artículo" })
    })
    const res = await handleCreateComment(req)
    expect(res.status).toBe(401)
  })
  it("debería crear un comentario con token válido", async () => {
  const token = await generateToken(1, "gameboy")
  const req = new Request("http://localhost/comments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ article_id: 1, content: "Buen artículo" })
  })
  const res = await handleCreateComment(req)
  expect(res.status).toBe(201)
})

it("debería obtener comentarios de un artículo", async () => {
  const token = await generateToken(1, "gameboy")
  const req = new Request("http://localhost/comments/1", {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const res = await handleGetComments(req, 1)
  expect(res.status).toBe(200)
})

it("debería retornar 403 al eliminar comentario ajeno", async () => {
  const token = await generateToken(2, "gameboy")
  const comment = createComment({ article_id: 1, user_id: 1, content: "Hola" })
  const req = new Request(`http://localhost/comments/${comment.id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  })
  const res = await handleDeleteComment(req, comment.id!)
  expect(res.status).toBe(403)
})

it("debería editar un comentario propio", async () => {
  const token = await generateToken(1, "gameboy")
  const comment = createComment({ article_id: 1, user_id: 1, content: "Original" })
  const req = new Request(`http://localhost/comments/${comment.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ content: "Editado" })
  })
  const res = await handleUpdateComment(req, comment.id!)
  expect(res.status).toBe(200)
})

it("debería retornar 403 al editar comentario ajeno", async () => {
  const token = await generateToken(2, "gameboy")
  const comment = createComment({ article_id: 1, user_id: 1, content: "Original" })
  const req = new Request(`http://localhost/comments/${comment.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ content: "Editado" })
  })
  const res = await handleUpdateComment(req, comment.id!)
  expect(res.status).toBe(403)
})

it("debería eliminar un comentario propio", async () => {
  const token = await generateToken(1, "gameboy")
  const comment = createComment({ article_id: 1, user_id: 1, content: "Borrame" })
  const req = new Request(`http://localhost/comments/${comment.id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  })
  const res = await handleDeleteComment(req, comment.id!)
  expect(res.status).toBe(200)
})


})