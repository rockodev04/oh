import { initRouter, registerRoute } from "./router.core"
import "../components/only-home/home.component"
import "../components/only-navbar/navbar.component"
import "../components/only-login/login.component"
import "../components/only-register/register.component"
import "../components/only-feed/feed.component"
import "../components/only-article/article.component"
import "../components/only-chat/chat.component"
import "../components/only-store/store.component"
import "../components/only-stream/stream.component"
import "../components/only-profile/profile.component"
import "../components/only-admin/admin.component"


registerRoute("/", "only-home")
registerRoute("/login", "only-login")
registerRoute("/register", "only-register")
registerRoute("/feed", "only-feed")
registerRoute("/article", "only-article")
registerRoute("/chat", "only-chat")
registerRoute("/store", "only-store")
registerRoute("/stream", "only-stream")
registerRoute("/profile", "only-profile")
registerRoute("/admin", "only-admin")

window.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    customElements.whenDefined('only-home'),
    customElements.whenDefined('only-login'),
    customElements.whenDefined('only-feed'),
  ])
  initRouter()
})