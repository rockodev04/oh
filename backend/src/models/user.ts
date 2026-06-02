export type User = {
  id?: number
  username: string
  email: string
  password_hash: string
  membership: "none" | "gameboy" | "playboy"
  role?: "none" | "staff" | "admin"
  createdAt?: Date
}