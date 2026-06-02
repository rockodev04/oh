import { describe, it, expect, beforeEach } from "bun:test"
import { handleAddLike, handleRemoveLike, handleCountLikes } from "../../src/routes/likeRoutes"
import { generateToken } from "../../src/services/jwtService"
import { likesDB } from "../../src/repositories/likeRepository"

describe("LikeRoutes", () => {
  beforeEach(() => {
    likesDB.run("DELETE FROM likes")
  })

  it("debería retornar 401 sin token", async () => {
    const req = new Request("http://localhost/likes/1", { method: "POST" })
    const res = await handleAddLike(req, 1)
    expect(res.status).toBe(401)
  })

  it("debería dar like con token válido", async () => {
    const token = await generateToken(1, "gameboy")
    const req = new Request("http://localhost/likes/1", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    })
    const res = await handleAddLike(req, 1)
    expect(res.status).toBe(201)
  })

  it("debería quitar like con token válido", async () => {
    const token = await generateToken(1, "gameboy")
    const req = new Request("http://localhost/likes/1", {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    })
    const res = await handleRemoveLike(req, 1)
    expect(res.status).toBe(200)
  })

  it("debería retornar el conteo de likes", async () => {
  const token = await generateToken(1, "gameboy")
  const req = new Request("http://localhost/likes/1/count", {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const res = await handleCountLikes(req, 1)
  expect(res.status).toBe(200)
})
})