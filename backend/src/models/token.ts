export type TokenPayload = {
  userId: number
  membership: string
  role?: string
  iat?: number
  exp?: number
}