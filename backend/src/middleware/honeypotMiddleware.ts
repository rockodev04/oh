import { addIpToBlacklist } from "../repositories/blacklistRepository";


export async function honeypotMiddleware(req: Request): Promise<Response | null> {
  const path = new URL(req.url).pathname
  const HONEYPOT_ROUTES = ["/admin/secret", "/wp-admin", "/config.php", "/.env", "/phpmyadmin"]

if(HONEYPOT_ROUTES.includes(path)) {
  const ip = req.headers.get("x-forwarded-for")
  if(ip) addIpToBlacklist(ip)
  return new Response("Forbidden", { status: 403 })
}
  return null;
}