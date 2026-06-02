import { describe, it, expect, beforeEach } from "bun:test"
import {createComment, getCommentsByArticleId,findCommentById, commentDB, updateComment, deleteCommentById } from "../../src/repositories/commentRepository"

describe("CommentRepository", () => {
  beforeEach(() => {
    commentDB.run("DELETE FROM comments")
  })

  it("debería crear un comentario", () => {
    const comment = createComment({
      article_id: 1,
      user_id: 1,
      content: "Muy buen artículo"
    })
    expect(comment.content).toBe("Muy buen artículo")
  })
  it("debería obtener comentarios por artículo", () => {
  createComment({ article_id: 1, user_id: 1, content: "Primer comentario" })
  createComment({ article_id: 1, user_id: 2, content: "Segundo comentario" })
  createComment({ article_id: 2, user_id: 1, content: "Otro artículo" })
  const comments = getCommentsByArticleId(1)
  expect(comments).toHaveLength(2)
})

it("debería encontrar un comentario por id", () => {
  const comment = createComment({ article_id: 1, user_id: 1, content: "Hola" })
  const found = findCommentById(comment.id!)
  expect(found?.content).toBe("Hola")
})

it("debería actualizar el contenido de un comentario", () => {
  const comment = createComment({ article_id: 1, user_id: 1, content: "Original" })
  const updated = updateComment(comment.id!, "Editado")
  expect(updated?.content).toBe("Editado")
})

it("debería eliminar un comentario por id", () => {
  const comment = createComment({ article_id: 1, user_id: 1, content: "Borrame" })
  deleteCommentById(comment.id!)
  const found = findCommentById(comment.id!)
  expect(found).toBeNull()
})

it("debería retornar null si el comentario no existe", () => {
  const result = updateComment(999, "Editado")
  expect(result).toBeNull()
})
})

