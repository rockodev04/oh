import { Database } from "bun:sqlite";
import { isIpBlacklisted } from "../repositories/blacklistRepository";

export async function blacklistMiddleware(req: Request): Promise<Response | null> {
  const ip = req.headers.get("x-forwarded-for")
  if (!ip) {
    return null
  }

  if (isIpBlacklisted(ip)) {
    return new Response("Access denied", { status: 403 })
  }

  return null
}