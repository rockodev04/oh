import type { TokenPayload } from "../models/token";
import { verifyToken } from "../services/jwtService";

export async function authenticate(token: string | undefined): Promise<TokenPayload | null> {
  if (!token) {
    return null;
  }

  return verifyToken(token);
} 