import { describe, it, expect, beforeEach } from "bun:test"
import { addLike, removeLike, getLikesByArticleId, hasUserLiked, likesDB , countLikesByArticleId} from "../../src/repositories/likeRepository"

describe("LikeRepository", () => {
  beforeEach(() => {
    likesDB.run("DELETE FROM likes")
  })

  it("debería agregar un like", () => {
    const like = addLike({ article_id: 1, user_id: 1 })
    expect(like.article_id).toBe(1)
  })

  it("debería eliminar un like", () => {
    addLike({ article_id: 1, user_id: 1 })
    removeLike(1, 1)
    const likes = getLikesByArticleId(1)
    expect(likes).toHaveLength(0)
  })

  it("debería verificar si un usuario ya dio like", () => {
    addLike({ article_id: 1, user_id: 1 })
    expect(hasUserLiked(1, 1)).toBe(true)
    expect(hasUserLiked(1, 2)).toBe(false)
  })

  it("debería contar los likes de un artículo", () => {
  addLike({ article_id: 1, user_id: 1 })
  addLike({ article_id: 1, user_id: 2 })
  addLike({ article_id: 2, user_id: 1 })
  const counterLikes = countLikesByArticleId(1)
  expect(counterLikes).toBe(2)
})
})