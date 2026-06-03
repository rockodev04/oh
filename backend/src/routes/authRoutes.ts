import { register, login } from "../services/authService"
import { generateToken } from "../services/jwtService"
import { getUserRole } from "../repositories/userRepository"

export async function handleRegister(req: Request): Promise<Response> {
  const body = await req.json() as { username: string, email: string, password: string }
  try {
    const user = await register(body.username, body.email, body.password)
    return new Response(JSON.stringify(user), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    })
  } catch {
    return new Response(JSON.stringify({ error: "Email already exists" }), {
      status: 409,
      headers: { "Content-Type": "application/json" }
    })
  }
}

export async function handleLogin(req: Request): Promise<Response> {
  const body = await req.json() as { email: string, password: string }
  const user = await login(body.email, body.password)

  if (!user) {
    return new Response(JSON.stringify({ error: "Invalid credentials" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    })
  }

  const role = await getUserRole(user.id!)
  const token = await generateToken(user.id!, user.membership, role)

  return new Response(JSON.stringify({
    token,
    membership: user.membership,
    username: user.username,
    userId: user.id,
    role
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
}
