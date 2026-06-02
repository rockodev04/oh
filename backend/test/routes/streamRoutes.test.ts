import { describe, it, expect, beforeEach } from "bun:test"
import { handleCreateStream, handleJoinStream, handleGetActiveStreams, handleEndStream} from "../../src/routes/streamRoutes"
import { generateToken } from "../../src/services/jwtService"
import { streamDB, createStream } from "../../src/repositories/streamRepository"

describe("StreamRoutes", () => {
  beforeEach(() => {
    streamDB.run("DELETE FROM streams")
  })

  it("debería retornar 401 sin token", async () => {
    const req = new Request("http://localhost/streams", { method: "POST" })
    const res = await handleCreateStream(req)
    expect(res.status).toBe(401)
  })

  it("debería crear una transmisión con token válido", async () => {
    const token = await generateToken(1, "playboy")
    const req = new Request("http://localhost/streams", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        title: "Convención de hacking 2024",
        membership_required: "none"
      })
    })
    const res = await handleCreateStream(req)
    expect(res.status).toBe(201)
  })

it("debería retornar 404 si la transmisión no existe", async () => {
  const token = await generateToken(1, "none")
  const req = new Request("http://localhost/streams/999/join", {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const res = await handleJoinStream(req, 999)
  expect(res.status).toBe(404)
})

it("debería unirse a una transmisión pública", async () => {
  const stream = createStream({ host_id: 1, title: "Stream test", status: "active", membership_required: "none" })
  const token = await generateToken(2, "none")
  const req = new Request(`http://localhost/streams/${stream.id}/join`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const res = await handleJoinStream(req, stream.id!)
  expect(res.status).toBe(200)
})

it("debería retornar 403 si no tiene la membresía requerida", async () => {
  const stream = createStream({ host_id: 1, title: "Stream VIP", status: "active", membership_required: "playboy" })
  const token = await generateToken(2, "none")
  const req = new Request(`http://localhost/streams/${stream.id}/join`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const res = await handleJoinStream(req, stream.id!)
  expect(res.status).toBe(403)
})

it("debería retornar transmisiones activas", async () => {
  createStream({ host_id: 1, title: "Stream activo", status: "active", membership_required: "none" })
  createStream({ host_id: 1, title: "Stream terminado", status: "ended", membership_required: "none" })
  const token = await generateToken(1, "none")
  const req = new Request("http://localhost/streams/active", {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const res = await handleGetActiveStreams(req)
  expect(res.status).toBe(200)
  const body = await res.json() as { streams: any[] }
  expect(body.streams).toHaveLength(1)
})

it("debería terminar una transmisión si es el host", async () => {
  const stream = createStream({ host_id: 1, title: "Stream test", status: "active", membership_required: "none" })
  const token = await generateToken(1, "playboy")
  const req = new Request(`http://localhost/streams/${stream.id}/end`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${token}` }
  })
  const res = await handleEndStream(req, stream.id!)
  expect(res.status).toBe(200)
})

it("debería retornar 403 si no es el host", async () => {
  const stream = createStream({ host_id: 1, title: "Stream test", status: "active", membership_required: "none" })
  const token = await generateToken(2, "playboy")
  const req = new Request(`http://localhost/streams/${stream.id}/end`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${token}` }
  })
  const res = await handleEndStream(req, stream.id!)
  expect(res.status).toBe(403)
})
})