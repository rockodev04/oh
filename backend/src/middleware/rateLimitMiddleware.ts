export const requestCounts = new Map<string, { count: number, resetTime: number }>()

export async function rateLimitMiddleware(req: Request): Promise<Response | null> {
  const claim = 60
  const timeClaim = 60000
  const ip = req.headers.get("x-forwarded-for")

  if(!ip) return null

  const requestCount = requestCounts.get(ip)

  if(!requestCount) {
    requestCounts.set(ip, { count: 1, resetTime: Date.now() + timeClaim })
    return null
  }

  if(requestCount.resetTime < Date.now()) {
    requestCounts.set(ip, { count: 1, resetTime: Date.now() + timeClaim })
    return null
  }

  if(requestCount.count >= claim) {
    return new Response("Too Many Requests", { status: 429 })
  }

  requestCount.count++
  return null
}