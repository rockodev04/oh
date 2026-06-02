export type Article = {
  id?: number
  title: string
  contentType: "public" | "creator" | "tips"
  body: string
  created_by?: number
}