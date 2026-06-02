import { describe, it, expect, beforeEach } from "bun:test"
import { createStream, findStreamById, streamDB } from "../../src/repositories/streamRepository"

describe("StreamRepository", () => {
  beforeEach(() => {
    streamDB.run("DELETE FROM streams")
  })

  it("debería crear una transmisión", () => {
    const stream = createStream({
      host_id: 1,
      title: "Convención de hacking 2024",
      status: "active",
      membership_required: "none"
    })
    expect(stream.title).toBe("Convención de hacking 2024")
  })

  it("debería encontrar una transmisión por id", () => {
    const stream = createStream({
      host_id: 1,
      title: "Convención de hacking 2024",
      status: "active",
      membership_required: "none"
    })
    const found = findStreamById(stream.id!)
    expect(found?.title).toBe("Convención de hacking 2024")
  })
})