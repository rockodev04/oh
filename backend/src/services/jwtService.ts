import type { TokenPayload } from '../models/token'

export async function generateToken(userId: number, membership: string, role: string = 'none'): Promise<string> {
  const JWT_SECRET = process.env.JWT_SECRET
  if(!JWT_SECRET){
    throw new Error('201 Token not generated')
  }
  const header = { alg: "HS256", typ: "JWT" }
  const payload = { userId, membership, role, iat: Date.now() }

  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))

  const encoder = new TextEncoder()

const key = await crypto.subtle.importKey(
  "raw",
  encoder.encode(JWT_SECRET),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"]
)

const signature = await crypto.subtle.sign(
  "HMAC",
  key,
  encoder.encode(`${encodedHeader}.${encodedPayload}`)
)

const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  const [encodedHeader, encodedPayload, signature] = token.split(".")
  
  if(!encodedHeader || !encodedPayload || !signature) return null

  const JWT_SECRET = process.env.JWT_SECRET
  if(!JWT_SECRET) return null

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const newSignature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${encodedHeader}.${encodedPayload}`)
  )

  const encodedNewSignature = btoa(String.fromCharCode(...new Uint8Array(newSignature)))

  if(encodedNewSignature !== signature) return null

  return JSON.parse(atob(encodedPayload)) as TokenPayload
}