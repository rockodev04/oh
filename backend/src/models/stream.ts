export type Stream = {
  id?: number
  host_id: number
  title: string
  status: "active" | "ended"
  membership_required: "none" | "gameboy" | "playboy"
  created_at?: string
}