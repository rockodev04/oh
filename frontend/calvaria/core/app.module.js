// src/core/router.core.ts
var routes = {};
function registerRoute(path, component) {
  routes[path] = component;
}
function navigate(path) {
  window.history.pushState({}, "", path);
  renderRoute(path);
}
function renderRoute(path) {
  const component = routes[path] ?? routes["/"];
  const app = document.getElementById("app");
  if (!app)
    return;
  if (path === "/article") {
    const id = localStorage.getItem("currentArticleId") ?? "";
    app.innerHTML = `<${component} article-id="${id}"></${component}>`;
    return;
  }
  app.innerHTML = `<${component}></${component}>`;
}
function initRouter() {
  window.addEventListener("popstate", () => {
    renderRoute(window.location.pathname);
  });
  document.addEventListener("click", (e) => {
    const target = e.target;
    const link = target.closest("[data-link]");
    if (!link)
      return;
    e.preventDefault();
    navigate(link.getAttribute("href") ?? "/");
  });
  renderRoute(window.location.pathname);
}

// src/components/only-home/home.component.ts
class OnlyHome extends HTMLElement {
  connectedCallback() {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/feed");
      return;
    }
    this.innerHTML = `
      <section class="auth-page fade-in" aria-label="OnlyHackers - Inicio">
        <div class="auth-box">
          <div class="auth-logo">
            <h1>Only<span>Hackers</span></h1>
            <p class="auth-subtitle">La comunidad de hacking ético más exclusiva</p>
          </div>
          <div style="display:flex; flex-direction:column; gap:12px; margin-top:32px;">
            <a href="/login" data-link class="btn btn-primary btn-lg btn-full">
              Iniciar sesión
            </a>
            <a href="/register" data-link class="btn btn-secondary btn-lg btn-full">
              Crear cuenta
            </a>
          </div>
          <p style="text-align:center; margin-top:24px; font-size:0.8rem; color:var(--text-muted);">
            \uD83D\uDD10 Comunidad privada de hacking ético
          </p>
        </div>
      </section>
    `;
  }
}
if (!customElements.get("only-home")) {
  customElements.define("only-home", OnlyHome);
}

// src/components/only-navbar/navbar.component.ts
class OnlyNavbar extends HTMLElement {
  connectedCallback() {
    const membership = localStorage.getItem("membership") ?? "none";
    const username = localStorage.getItem("username") ?? "Hacker";
    const role = localStorage.getItem("role") ?? "none";
    this.innerHTML = `
      <nav class="navbar" aria-label="Navegación principal">
        <a href="/" data-link class="navbar-brand">Only<span>Hackers</span></a>
        <ul class="navbar-nav">
          <li><a href="/feed" data-link>Feed</a></li>
          <li><a href="/chat" data-link>Chat</a></li>
          <li><a href="/store" data-link>Tienda</a></li>
          <li><a href="/stream" data-link>Streaming</a></li>
          ${role === "admin" || role === "staff" ? `<li><a href="/admin" data-link>Admin</a></li>` : ""}
          <li>
            <a href="/profile" data-link>
              <span class="membership-${membership}">${username}</span>
            </a>
          </li>
        </ul>
        <button id="logout-btn" class="btn btn-secondary btn-sm">Salir</button>
      </nav>
    `;
    this.querySelector("#logout-btn")?.addEventListener("click", () => {
      localStorage.clear();
      navigate("/login");
    });
    const current = window.location.pathname;
    this.querySelectorAll(".navbar-nav a").forEach((link) => {
      if (link.getAttribute("href") === current) {
        link.classList.add("active");
      }
    });
  }
}
if (!customElements.get("only-navbar")) {
  customElements.define("only-navbar", OnlyNavbar);
}

// src/components/only-login/login.component.ts
class OnlyLogin extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="auth-page fade-in" aria-label="Iniciar sesión">
        <div class="auth-box">
          <div class="auth-logo">
            <h1>Only<span>Hackers</span></h1>
            <p class="auth-subtitle">Ingresa tus credenciales</p>
          </div>

          <div id="login-error" class="alert alert-error" style="display:none" role="alert"></div>

          <form id="login-form" novalidate>
            <div class="form-group">
              <label class="form-label" for="login-email">Email</label>
              <input class="form-input" type="email" id="login-email"
                placeholder="tu@email.com" autocomplete="email" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="login-password">Contraseña</label>
              <input class="form-input" type="password" id="login-password"
                placeholder="••••••••" autocomplete="current-password" required />
            </div>
            <button type="submit" class="btn btn-primary btn-full btn-lg">
              Iniciar sesión
            </button>
          </form>

          <div class="auth-footer">
            ¿No tienes cuenta?
            <a href="/register" data-link>Regístrate aquí</a>
          </div>
        </div>
      </section>
    `;
    this.querySelector("#login-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = this.querySelector("#login-error");
      const submitBtn = this.querySelector('button[type="submit"]');
      const email = this.querySelector("#login-email").value.trim();
      const password = this.querySelector("#login-password").value;
      errorEl.style.display = "none";
      submitBtn.textContent = "Ingresando...";
      submitBtn.disabled = true;
      try {
        const res = await fetch("http://localhost:3001/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) {
          errorEl.textContent = data.error ?? "Credenciales incorrectas";
          errorEl.style.display = "block";
          return;
        }
        localStorage.setItem("token", data.token);
        localStorage.setItem("membership", data.membership ?? "none");
        localStorage.setItem("username", data.username ?? "Hacker");
        localStorage.setItem("userId", String(data.userId ?? "0"));
        localStorage.setItem("role", data.role ?? "none");
        navigate("/feed");
      } catch {
        errorEl.textContent = "Error de conexión con el servidor";
        errorEl.style.display = "block";
      } finally {
        submitBtn.textContent = "Iniciar sesión";
        submitBtn.disabled = false;
      }
    });
  }
}
if (!customElements.get("only-login")) {
  customElements.define("only-login", OnlyLogin);
}

// src/components/only-register/register.component.ts
class OnlyRegister extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="auth-page fade-in" aria-label="Crear cuenta">
        <div class="auth-box">
          <div class="auth-logo">
            <h1>Only<span>Hackers</span></h1>
            <p class="auth-subtitle">Crea tu cuenta y únete a la comunidad</p>
          </div>

          <div id="register-error" class="alert alert-error" style="display:none" role="alert"></div>
          <div id="register-success" class="alert alert-success" style="display:none" role="alert"></div>

          <form id="register-form" novalidate>
            <div class="form-group">
              <label class="form-label" for="reg-username">Username</label>
              <input class="form-input" type="text" id="reg-username"
                placeholder="lobo_hacker" autocomplete="username" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-email">Email</label>
              <input class="form-input" type="email" id="reg-email"
                placeholder="tu@email.com" autocomplete="email" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-password">Contraseña</label>
              <input class="form-input" type="password" id="reg-password"
                placeholder="Mín. 8 caracteres, mayúscula, número y símbolo"
                autocomplete="new-password" required />
            </div>
            <button type="submit" class="btn btn-primary btn-full btn-lg">
              Crear cuenta
            </button>
          </form>

          <div class="auth-footer">
            ¿Ya tienes cuenta?
            <a href="/login" data-link>Inicia sesión</a>
          </div>
        </div>
      </section>
    `;
    this.querySelector("#register-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = this.querySelector("#register-error");
      const successEl = this.querySelector("#register-success");
      const submitBtn = this.querySelector('button[type="submit"]');
      const username = this.querySelector("#reg-username").value.trim();
      const email = this.querySelector("#reg-email").value.trim();
      const password = this.querySelector("#reg-password").value;
      errorEl.style.display = "none";
      successEl.style.display = "none";
      submitBtn.textContent = "Creando cuenta...";
      submitBtn.disabled = true;
      try {
        const res = await fetch("http://localhost:3001/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (!res.ok) {
          errorEl.textContent = data.error ?? "Error al crear la cuenta";
          errorEl.style.display = "block";
          return;
        }
        successEl.textContent = "¡Cuenta creada! Redirigiendo...";
        successEl.style.display = "block";
        setTimeout(() => navigate("/login"), 1500);
      } catch {
        errorEl.textContent = "Error de conexión con el servidor";
        errorEl.style.display = "block";
      } finally {
        submitBtn.textContent = "Crear cuenta";
        submitBtn.disabled = false;
      }
    });
  }
}
if (!customElements.get("only-register")) {
  customElements.define("only-register", OnlyRegister);
}

// src/components/only-feed/feed.component.ts
class OnlyFeed extends HTMLElement {
  async connectedCallback() {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    this.innerHTML = `
      <only-navbar></only-navbar>
      <main class="container fade-in" style="padding-top:32px;">
        <div class="feed-grid">
          <section aria-label="Artículos">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
              <h2>Feed</h2>
              <button id="new-article-btn" class="btn btn-primary btn-sm">+ Nuevo artículo</button>
            </div>
            <div id="articles-list" class="feed-list">
              <div class="skeleton-card">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text" style="width:80%"></div>
              </div>
              <div class="skeleton-card">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text" style="width:70%"></div>
              </div>
              <div class="skeleton-card">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text" style="width:75%"></div>
              </div>
            </div>
          </section>

          <aside aria-label="Información de membresía">
            <div class="card" style="position:sticky; top:90px;">
              <h3 style="margin-bottom:16px;">Tu membresía</h3>
              <p id="membership-info" style="margin-bottom:16px;"></p>
              <a href="/profile" data-link class="btn btn-secondary btn-full btn-sm">
                Ver perfil
              </a>
            </div>
          </aside>
        </div>
      </main>
    `;
    const membership = localStorage.getItem("membership") ?? "none";
    const membershipEl = this.querySelector("#membership-info");
    const labels = {
      none: "\uD83D\uDD13 Sin membresía — solo contenido público",
      gameboy: "\uD83C\uDFAE Gameboy — contenido público y de creadores",
      playboy: "\uD83C\uDCCF Playboy — acceso completo + tips exclusivos"
    };
    membershipEl.textContent = labels[membership] ?? labels.none;
    await this.loadArticles(token);
    this.querySelector("#new-article-btn")?.addEventListener("click", () => {
      if (membership === "none") {
        alert("Necesitas una membresía para crear artículos");
        return;
      }
      this.showNewArticleForm();
    });
  }
  async loadArticles(token) {
    const list = this.querySelector("#articles-list");
    try {
      const res = await fetch("http://localhost:3001/content", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.articles?.length) {
        list.innerHTML = `<div class="card"><p>No hay artículos disponibles aún.</p></div>`;
        return;
      }
      list.innerHTML = data.articles.map((a) => `
        <article class="article-card fade-in" data-id="${a.id}" aria-label="${a.title}" style="cursor:pointer;">
          <div class="article-meta">
            <span class="badge badge-${a.contentType}">${a.contentType}</span>
          </div>
          <h3 class="article-title">${a.title}</h3>
          <p class="article-body">${a.body}</p>
          <div class="article-actions">
            <button class="action-btn like-btn" data-id="${a.id}" aria-label="Dar like">
              ♥ Like
            </button>
            <button class="action-btn view-btn" data-id="${a.id}" aria-label="Ver artículo">
              \uD83D\uDCAC Ver artículo
            </button>
          </div>
        </article>
      `).join("");
      this.querySelectorAll(".view-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = btn.dataset.id ?? "";
          localStorage.setItem("currentArticleId", id);
          navigate("/article");
        });
      });
      this.querySelectorAll(".like-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          await fetch(`http://localhost:3001/likes/${id}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
          });
          btn.classList.toggle("liked");
        });
      });
      this.querySelectorAll(".article-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          const target = e.target;
          if (target.closest(".action-btn"))
            return;
          const id = card.dataset.id ?? "";
          localStorage.setItem("currentArticleId", id);
          navigate("/article");
        });
      });
    } catch {
      list.innerHTML = `<div class="alert alert-error">Error al cargar artículos</div>`;
    }
  }
  showNewArticleForm() {
    const list = this.querySelector("#articles-list");
    const form = document.createElement("div");
    form.className = "card fade-in";
    form.innerHTML = `
      <h3 style="margin-bottom:16px;">Nuevo artículo</h3>
      <div class="form-group">
        <label class="form-label">Título</label>
        <input class="form-input" id="new-title" placeholder="Título del artículo" />
      </div>
      <div class="form-group">
        <label class="form-label">Tipo</label>
        <select class="form-input" id="new-type">
          <option value="public">Público</option>
          <option value="creator">Creadores</option>
          <option value="tips">Tips exclusivos</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Contenido</label>
        <textarea class="form-input" id="new-body" rows="4" placeholder="Escribe aquí..."></textarea>
      </div>
      <div style="display:flex; gap:12px;">
        <button id="submit-article" class="btn btn-primary">Publicar</button>
        <button id="cancel-article" class="btn btn-secondary">Cancelar</button>
      </div>
    `;
    list.prepend(form);
    form.querySelector("#cancel-article")?.addEventListener("click", () => form.remove());
    form.querySelector("#submit-article")?.addEventListener("click", async () => {
      const token = localStorage.getItem("token");
      const title = form.querySelector("#new-title").value;
      const contentType = form.querySelector("#new-type").value;
      const body = form.querySelector("#new-body").value;
      const res = await fetch("http://localhost:3001/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, contentType, body })
      });
      if (res.ok) {
        form.remove();
        await this.loadArticles(token);
      }
    });
  }
}
if (!customElements.get("only-feed")) {
  customElements.define("only-feed", OnlyFeed);
}

// src/components/only-article/article.component.ts
class OnlyArticle extends HTMLElement {
  async connectedCallback() {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const articleId = this.getAttribute("article-id");
    if (!articleId) {
      navigate("/feed");
      return;
    }
    this.innerHTML = `
      <only-navbar></only-navbar>
      <main class="container fade-in" style="padding-top:32px; max-width:800px;">
        <button id="back-btn" class="btn btn-secondary btn-sm" style="margin-bottom:24px;">
          ← Volver al feed
        </button>

        <div id="article-content">
          <div class="loading-page"><div class="spinner"></div></div>
        </div>

        <section id="comments-section" style="margin-top:40px;">
          <h3 style="margin-bottom:16px;">Comentarios</h3>
          <div id="comments-list">
            <div class="loading-page"><div class="spinner"></div></div>
          </div>

          <div class="card" style="margin-top:16px;">
            <div class="form-group" style="margin-bottom:12px;">
              <label class="form-label">Nuevo comentario</label>
              <textarea class="form-input" id="comment-input" rows="3"
                placeholder="Escribe tu comentario..."></textarea>
            </div>
            <button id="submit-comment-btn" class="btn btn-primary btn-sm">
              Comentar
            </button>
          </div>
        </section>
      </main>
    `;
    this.querySelector("#back-btn")?.addEventListener("click", () => navigate("/feed"));
    await this.loadArticle(token, parseInt(articleId));
    await this.loadComments(token, parseInt(articleId));
    this.setupComment(token, parseInt(articleId));
  }
  async loadArticle(token, id) {
    const container = this.querySelector("#article-content");
    try {
      const res = await fetch(`http://localhost:3001/articles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        container.innerHTML = `<div class="alert alert-error">Artículo no encontrado</div>`;
        return;
      }
      const article = await res.json();
      const userId = parseInt(localStorage.getItem("userId") ?? "0");
      const isOwner = article.created_by === userId;
      container.innerHTML = `
        <article aria-label="${article.title}">
          <div class="article-meta" style="margin-bottom:16px;">
            <span class="badge badge-${article.contentType}">${article.contentType}</span>
          </div>
          <h1 style="margin-bottom:16px;">${article.title}</h1>
          <p style="color:var(--text-muted); line-height:1.8; margin-bottom:24px;">${article.body}</p>

          <div class="article-actions">
            <button class="action-btn like-btn" data-id="${article.id}" aria-label="Dar like">
              ♥ Like
            </button>
            ${isOwner ? `
              <button id="delete-article-btn" class="btn btn-danger btn-sm" data-id="${article.id}">
                Eliminar artículo
              </button>
            ` : ""}
          </div>
        </article>
      `;
      this.querySelector(".like-btn")?.addEventListener("click", async () => {
        await fetch(`http://localhost:3001/likes/${id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        const btn = this.querySelector(".like-btn");
        btn.classList.toggle("liked");
      });
      this.querySelector("#delete-article-btn")?.addEventListener("click", async () => {
        const res2 = await fetch(`http://localhost:3001/articles/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res2.ok)
          navigate("/feed");
      });
    } catch {
      container.innerHTML = `<div class="alert alert-error">Error al cargar el artículo</div>`;
    }
  }
  async loadComments(token, articleId) {
    const list = this.querySelector("#comments-list");
    try {
      const res = await fetch(`http://localhost:3001/comments/${articleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.comment?.length) {
        list.innerHTML = `<p style="color:var(--text-muted); font-size:0.875rem;">Sin comentarios aún. ¡Sé el primero!</p>`;
        return;
      }
      const userId = parseInt(localStorage.getItem("userId") ?? "0");
      list.innerHTML = data.comment.map((c) => `
        <div class="card fade-in" style="padding:16px; margin-bottom:8px;">
          <p style="font-size:0.875rem; color:var(--surface); margin-bottom:8px;">${c.content}</p>
          <div style="display:flex; gap:8px; align-items:center;">
            <span style="font-size:0.75rem; color:var(--text-muted);">Usuario #${c.user_id}</span>
            ${c.user_id === userId ? `
              <button class="action-btn delete-comment-btn" data-id="${c.id}" style="font-size:0.75rem;">
                Eliminar
              </button>
            ` : ""}
          </div>
        </div>
      `).join("");
      this.querySelectorAll(".delete-comment-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const commentId = parseInt(btn.dataset.id ?? "0");
          const res2 = await fetch(`http://localhost:3001/comments/${commentId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res2.ok)
            await this.loadComments(token, articleId);
        });
      });
    } catch {
      list.innerHTML = `<p style="color:var(--danger); font-size:0.8rem;">Error al cargar comentarios</p>`;
    }
  }
  setupComment(token, articleId) {
    this.querySelector("#submit-comment-btn")?.addEventListener("click", async () => {
      const input = this.querySelector("#comment-input");
      const content = input.value.trim();
      if (!content)
        return;
      const res = await fetch("http://localhost:3001/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ article_id: articleId, content })
      });
      if (res.ok) {
        input.value = "";
        await this.loadComments(token, articleId);
      }
    });
  }
}
if (!customElements.get("only-article")) {
  customElements.define("only-article", OnlyArticle);
}

// src/components/only-chat/chat.component.ts
class OnlyChat extends HTMLElement {
  async connectedCallback() {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    this.innerHTML = `
      <only-navbar></only-navbar>
      <div class="chat-layout fade-in">
        <aside class="chat-sidebar" aria-label="Conversaciones">
          <h3 style="margin-bottom:16px; font-size:0.9rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-muted);">
            Mensajes
          </h3>
          <div id="conversations-list">
            <div class="skeleton-card" style="padding:12px;">
              <div class="skeleton skeleton-text" style="width:60%"></div>
              <div class="skeleton skeleton-text" style="width:80%"></div>
            </div>
            <div class="skeleton-card" style="padding:12px;">
              <div class="skeleton skeleton-text" style="width:50%"></div>
              <div class="skeleton skeleton-text" style="width:70%"></div>
            </div>
          </div>
          <hr class="divider" />
          <div class="form-group">
            <label class="form-label" for="receiver-id">Nuevo mensaje</label>
            <input class="form-input" id="receiver-id" type="number" placeholder="ID del usuario" />
            <button id="start-chat-btn" class="btn btn-primary btn-sm btn-full" style="margin-top:8px;">
              Iniciar chat
            </button>
          </div>
        </aside>

        <section class="chat-main" aria-label="Conversación">
          <div id="chat-header" style="padding:16px 24px; border-bottom:1px solid var(--border); display:none;">
            <p style="font-size:0.875rem; color:var(--text-muted);">Conversación con <span id="chat-with"></span></p>
          </div>
          <div id="chat-messages" class="chat-messages">
            <div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--text-muted); font-size:0.875rem;">
              Selecciona un chat para empezar
            </div>
          </div>
          <div class="chat-input-area">
            <input class="form-input" id="message-input" placeholder="Escribe un mensaje..." disabled />
            <button id="send-btn" class="btn btn-primary" disabled>Enviar</button>
          </div>
        </section>
      </div>
    `;
    await this.loadMessages(token);
    this.setupSend(token);
    this.setupNewChat(token);
  }
  async loadMessages(token) {
    const list = this.querySelector("#conversations-list");
    try {
      const res = await fetch("http://localhost:3001/messages", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.messages?.length) {
        list.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted);">Sin mensajes aún</p>`;
        return;
      }
      const myId = parseInt(localStorage.getItem("userId") ?? "0");
      const conversations = new Map;
      data.messages.forEach((m) => {
        const otherId = m.sender_id === myId ? m.receiver_id : m.sender_id;
        const otherName = m.sender_id === myId ? `Usuario #${m.receiver_id}` : m.sender_username ?? `Usuario #${m.sender_id}`;
        if (!conversations.has(otherId)) {
          conversations.set(otherId, { id: otherId, name: otherName, lastMessage: m.content });
        }
      });
      list.innerHTML = Array.from(conversations.values()).map((c) => `
        <div class="card fade-in conversation-item" data-user-id="${c.id}" style="padding:12px; margin-bottom:8px; cursor:pointer;">
          <p style="font-size:0.8rem; color:var(--accent); font-weight:700;">${c.name}</p>
          <p style="font-size:0.8rem; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.lastMessage}</p>
        </div>
      `).join("");
      this.querySelectorAll(".conversation-item").forEach((item) => {
        item.addEventListener("click", () => {
          const userId = parseInt(item.dataset.userId ?? "0");
          const userName = item.querySelector("p")?.textContent ?? `Usuario #${userId}`;
          this.showConversation(data.messages, userId, userName, token);
          const receiverInput = this.querySelector("#receiver-id");
          const msgInput = this.querySelector("#message-input");
          const sendBtn = this.querySelector("#send-btn");
          receiverInput.value = userId.toString();
          msgInput.disabled = false;
          sendBtn.disabled = false;
        });
      });
    } catch {
      list.innerHTML = `<p style="color:var(--danger); font-size:0.8rem;">Error al cargar mensajes</p>`;
    }
  }
  showConversation(messages, userId, userName, token) {
    const header = this.querySelector("#chat-header");
    const chatWith = this.querySelector("#chat-with");
    header.style.display = "block";
    chatWith.textContent = userName;
    const myId = parseInt(localStorage.getItem("userId") ?? "0");
    const filtered = messages.filter((m) => m.sender_id === userId && m.receiver_id === myId || m.sender_id === myId && m.receiver_id === userId);
    this.renderMessages(filtered, token);
  }
  renderMessages(messages, token) {
    const container = this.querySelector("#chat-messages");
    const myId = parseInt(localStorage.getItem("userId") ?? "0");
    if (!messages.length) {
      container.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--text-muted); font-size:0.875rem;">
          Sin mensajes aún
        </div>`;
      return;
    }
    container.innerHTML = messages.map((m) => {
      const isOwn = m.sender_id === myId;
      return `
        <div class="message ${isOwn ? "own" : ""}" role="article" data-id="${m.id}">
          <div class="message-bubble">
            ${m.content}
            ${isOwn ? `
              <div style="display:flex; gap:6px; margin-top:6px; justify-content:flex-end;">
                <button class="action-btn edit-msg-btn" data-id="${m.id}" data-content="${m.content}" style="font-size:0.7rem; padding:2px 6px;">✏️</button>
                <button class="action-btn delete-msg-btn" data-id="${m.id}" style="font-size:0.7rem; padding:2px 6px; color:var(--danger);">\uD83D\uDDD1️</button>
              </div>
            ` : ""}
          </div>
        </div>
      `;
    }).join("");
    container.scrollTop = container.scrollHeight;
    container.querySelectorAll(".delete-msg-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const res = await fetch(`http://localhost:3001/messages/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const receiverId = parseInt(this.querySelector("#receiver-id").value);
          const chatWith = this.querySelector("#chat-with")?.textContent ?? "";
          await this.loadMessages(token);
          const allMessages = await fetch("http://localhost:3001/messages", {
            headers: { Authorization: `Bearer ${token}` }
          }).then((r) => r.json());
          this.showConversation(allMessages.messages, receiverId, chatWith, token);
        }
      });
    });
    container.querySelectorAll(".edit-msg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const content = btn.dataset.content ?? "";
        const input = this.querySelector("#message-input");
        input.value = content;
        input.focus();
        input.dataset.editId = id;
      });
    });
  }
  setupSend(token) {
    const input = this.querySelector("#message-input");
    const btn = this.querySelector("#send-btn");
    const send = async () => {
      const content = input.value.trim();
      const receiverId = parseInt(this.querySelector("#receiver-id").value);
      const editId = input.dataset.editId;
      if (!content)
        return;
      if (editId) {
        const res2 = await fetch(`http://localhost:3001/messages/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content })
        });
        if (res2.ok) {
          input.value = "";
          delete input.dataset.editId;
          await this.loadMessages(token);
          const receiverId2 = parseInt(this.querySelector("#receiver-id").value);
          const chatWith = this.querySelector("#chat-with")?.textContent ?? "";
          const allMessages = await fetch("http://localhost:3001/messages", {
            headers: { Authorization: `Bearer ${token}` }
          }).then((r) => r.json());
          this.showConversation(allMessages.messages, receiverId2, chatWith, token);
        }
        return;
      }
      if (!receiverId)
        return;
      const res = await fetch("http://localhost:3001/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiver_id: receiverId, content })
      });
      if (res.ok) {
        input.value = "";
        await this.loadMessages(token);
        const container = this.querySelector("#chat-messages");
        container.scrollTop = container.scrollHeight;
      }
    };
    btn.addEventListener("click", send);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter")
        send();
    });
  }
  setupNewChat(token) {
    this.querySelector("#start-chat-btn")?.addEventListener("click", () => {
      const receiverId = parseInt(this.querySelector("#receiver-id").value);
      const input = this.querySelector("#message-input");
      const btn = this.querySelector("#send-btn");
      if (!receiverId) {
        alert("Escribe el ID del usuario primero");
        return;
      }
      const header = this.querySelector("#chat-header");
      const chatWith = this.querySelector("#chat-with");
      header.style.display = "block";
      chatWith.textContent = `Usuario #${receiverId}`;
      input.disabled = false;
      btn.disabled = false;
      input.focus();
    });
  }
}
if (!customElements.get("only-chat")) {
  customElements.define("only-chat", OnlyChat);
}

// src/components/only-store/store.component.ts
class OnlyStore extends HTMLElement {
  async connectedCallback() {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    this.innerHTML = `
      <only-navbar></only-navbar>
      <main class="container fade-in" style="padding-top:32px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:32px;">
          <h2>Tienda</h2>
          <button id="cart-btn" class="btn btn-secondary btn-sm">
            \uD83D\uDED2 Carrito (<span id="cart-count">0</span>)
          </button>
        </div>

        <div id="cart-alert" class="alert alert-success" style="display:none;"></div>

        <div id="products-grid" class="store-grid">
          <div class="skeleton-card">
            <div class="skeleton" style="height:180px; border-radius:12px; margin-bottom:16px;"></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width:40%"></div>
          </div>
          <div class="skeleton-card">
            <div class="skeleton" style="height:180px; border-radius:12px; margin-bottom:16px;"></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width:40%"></div>
          </div>
          <div class="skeleton-card">
            <div class="skeleton" style="height:180px; border-radius:12px; margin-bottom:16px;"></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width:40%"></div>
          </div>
        </div>
      </main>
    `;
    await this.loadProducts(token);
    this.querySelector("#cart-btn")?.addEventListener("click", async () => {
      await this.processOrder(token);
    });
  }
  async loadProducts(token) {
    const grid = this.querySelector("#products-grid");
    try {
      const res = await fetch("http://localhost:3001/products", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.products?.length) {
        grid.innerHTML = `<div class="card"><p>No hay productos disponibles.</p></div>`;
        return;
      }
      grid.innerHTML = data.products.map((p) => `
        <article class="product-card fade-in" aria-label="${p.name}">
          <div class="product-img" aria-hidden="true">\uD83D\uDEE1️</div>
          <div class="product-info">
            <h3 class="product-name">${p.name}</h3>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px;">${p.description}</p>
            <p class="product-price">$${p.price.toFixed(2)}</p>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:12px;">
              Stock: ${p.stock}
            </p>
            <button class="btn btn-primary btn-sm btn-full add-cart-btn"
              data-id="${p.id}" data-name="${p.name}">
              Agregar al carrito
            </button>
          </div>
        </article>
      `).join("");
      this.querySelectorAll(".add-cart-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const productId = parseInt(btn.dataset.id ?? "0");
          await this.addToCart(token, productId);
        });
      });
    } catch {
      grid.innerHTML = `<div class="alert alert-error">Error al cargar productos</div>`;
    }
  }
  async addToCart(token, productId) {
    const res = await fetch("http://localhost:3001/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ product_id: productId, quantity: 1 })
    });
    if (res.ok) {
      const count = this.querySelector("#cart-count");
      count.textContent = String(parseInt(count.textContent ?? "0") + 1);
    }
  }
  async processOrder(token) {
    const alert2 = this.querySelector("#cart-alert");
    const res = await fetch("http://localhost:3001/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      alert2.textContent = "✅ Orden procesada correctamente";
      alert2.style.display = "block";
      this.querySelector("#cart-count").textContent = "0";
      setTimeout(() => {
        alert2.style.display = "none";
      }, 3000);
    } else {
      alert2.className = "alert alert-error";
      alert2.textContent = "El carrito está vacío";
      alert2.style.display = "block";
      setTimeout(() => {
        alert2.style.display = "none";
      }, 3000);
    }
  }
}
if (!customElements.get("only-store")) {
  customElements.define("only-store", OnlyStore);
}

// src/components/only-stream/stream.component.ts
class OnlyStream extends HTMLElement {
  ws = null;
  peerConnection = null;
  localStream = null;
  streamId = "";
  async connectedCallback() {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    this.innerHTML = `
      <only-navbar></only-navbar>
      <main class="container fade-in" style="padding-top:32px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
          <h2>Streaming</h2>
          <button id="new-stream-btn" class="btn btn-primary btn-sm">+ Nueva transmisión</button>
        </div>

        <div id="stream-alert" class="alert" style="display:none;"></div>

        <div id="host-panel" style="display:none;" class="card fade-in" style="margin-bottom:24px;">
          <h3 style="margin-bottom:16px;">Tu transmisión</h3>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
            <video id="local-video" autoplay muted playsinline
              style="width:100%; border-radius:12px; background:#000; aspect-ratio:16/9;">
            </video>
            <div style="display:flex; flex-direction:column; gap:12px; justify-content:center;">
              <button id="share-camera-btn" class="btn btn-primary">\uD83D\uDCF7 Compartir cámara</button>
              <button id="share-screen-btn" class="btn btn-secondary">\uD83D\uDDA5️ Compartir pantalla</button>
              <button id="stop-stream-btn" class="btn btn-danger" style="display:none;">⏹ Detener transmisión</button>
            </div>
          </div>
          <div id="stream-status" style="font-size:0.8rem; color:var(--text-muted);"></div>
        </div>

        <div id="active-streams">
          <div class="skeleton-card">
            <div class="skeleton skeleton-title" style="width:30%"></div>
            <div class="skeleton skeleton-text" style="width:50%"></div>
            <div class="skeleton" style="height:200px; border-radius:12px; margin-top:16px;"></div>
          </div>
          <div class="skeleton-card">
            <div class="skeleton skeleton-title" style="width:40%"></div>
            <div class="skeleton skeleton-text" style="width:60%"></div>
            <div class="skeleton" style="height:200px; border-radius:12px; margin-top:16px;"></div>
          </div>
        </div>
      </main>
    `;
    await this.loadStreams(token);
    this.querySelector("#new-stream-btn")?.addEventListener("click", () => {
      this.showNewStreamForm(token);
    });
  }
  async loadStreams(token) {
    const container = this.querySelector("#active-streams");
    try {
      const res = await fetch("http://localhost:3001/streams/active", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.streams?.length) {
        container.innerHTML = `
          <div class="card" style="text-align:center; padding:48px;">
            <p style="font-size:2rem; margin-bottom:12px;">\uD83D\uDCE1</p>
            <p>No hay transmisiones activas en este momento.</p>
          </div>`;
        return;
      }
      container.innerHTML = data.streams.map((s) => `
        <div class="card fade-in" style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div>
              <span class="stream-live">EN VIVO</span>
              <h3 style="margin-top:8px;">${s.title}</h3>
              <p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">
                Membresía requerida: <span class="membership-${s.membership_required}">${s.membership_required}</span>
              </p>
            </div>
            <button class="btn btn-primary btn-sm join-btn" data-id="${s.id}">Unirse</button>
          </div>
          <video id="remote-video-${s.id}" autoplay playsinline
            style="width:100%; border-radius:12px; background:#000; aspect-ratio:16/9; display:none;">
          </video>
          <div id="viewer-status-${s.id}" style="display:none; padding:16px; text-align:center; color:var(--text-muted); font-size:0.875rem;">
            Conectando...
          </div>
        </div>
      `).join("");
      this.querySelectorAll(".join-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = parseInt(btn.dataset.id ?? "0");
          const res2 = await fetch(`http://localhost:3001/streams/${id}/join`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res2.ok) {
            this.joinStreamAsViewer(id.toString());
            const video = this.querySelector(`#remote-video-${id}`);
            const status = this.querySelector(`#viewer-status-${id}`);
            video.style.display = "block";
            status.style.display = "block";
          } else {
            const data2 = await res2.json();
            alert(data2.error ?? "No tienes acceso a esta transmisión");
          }
        });
      });
    } catch {
      container.innerHTML = `<div class="alert alert-error">Error al cargar transmisiones</div>`;
    }
  }
  showNewStreamForm(token) {
    const container = this.querySelector("#active-streams");
    const existing = this.querySelector("#new-stream-form");
    if (existing) {
      existing.remove();
      return;
    }
    const form = document.createElement("div");
    form.id = "new-stream-form";
    form.className = "card fade-in";
    form.style.marginBottom = "16px";
    form.innerHTML = `
      <h3 style="margin-bottom:16px;">Nueva transmisión</h3>
      <div class="form-group">
        <label class="form-label">Título</label>
        <input class="form-input" id="stream-title" placeholder="Convención de hacking 2025" />
      </div>
      <div class="form-group">
        <label class="form-label">Membresía requerida</label>
        <select class="form-input" id="stream-membership">
          <option value="none">Pública</option>
          <option value="gameboy">Gameboy</option>
          <option value="playboy">Playboy</option>
        </select>
      </div>
      <div style="display:flex; gap:12px;">
        <button id="start-stream-btn" class="btn btn-primary">Iniciar transmisión</button>
        <button id="cancel-stream-btn" class="btn btn-secondary">Cancelar</button>
      </div>
    `;
    container.prepend(form);
    form.querySelector("#cancel-stream-btn")?.addEventListener("click", () => form.remove());
    form.querySelector("#start-stream-btn")?.addEventListener("click", async () => {
      const title = form.querySelector("#stream-title").value;
      const membership = form.querySelector("#stream-membership").value;
      const res = await fetch("http://localhost:3001/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, membership_required: membership })
      });
      if (res.ok) {
        const stream = await res.json();
        this.streamId = stream.id.toString();
        form.remove();
        this.startAsHost(token);
      }
    });
  }
  startAsHost(token) {
    const hostPanel = this.querySelector("#host-panel");
    hostPanel.style.display = "block";
    this.connectSignaling(this.streamId, "host");
    this.querySelector("#share-camera-btn")?.addEventListener("click", async () => {
      await this.startLocalStream("camera");
    });
    this.querySelector("#share-screen-btn")?.addEventListener("click", async () => {
      await this.startLocalStream("screen");
    });
    this.querySelector("#stop-stream-btn")?.addEventListener("click", async () => {
      this.stopStream(token);
    });
  }
  async startLocalStream(type) {
    try {
      if (this.localStream)
        this.localStream.getTracks().forEach((t) => t.stop());
      if (type === "camera") {
        this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } else {
        this.localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      }
      const localVideo = this.querySelector("#local-video");
      localVideo.srcObject = this.localStream;
      const stopBtn = this.querySelector("#stop-stream-btn");
      stopBtn.style.display = "block";
      const status = this.querySelector("#stream-status");
      status.textContent = type === "camera" ? "\uD83D\uDCF7 Transmitiendo desde cámara" : "\uD83D\uDDA5️ Compartiendo pantalla";
      this.broadcastStream();
    } catch {
      alert("No se pudo acceder al dispositivo. Verifica los permisos.");
    }
  }
  connectSignaling(streamId, role) {
    this.ws = new WebSocket("ws://localhost:3002");
    const userId = localStorage.getItem("userId") ?? "0";
    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({ type: "join", streamId, userId, role }));
    };
    this.ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (role === "host") {
        if (data.type === "user-joined")
          await this.createOffer(data.userId);
        if (data.type === "answer")
          await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }
      if (role === "viewer") {
        if (data.type === "offer")
          await this.handleOffer(data.sdp, streamId);
        if (data.type === "answer")
          await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }
      if (data.type === "ice-candidate" && data.candidate) {
        await this.peerConnection?.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };
  }
  broadcastStream() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });
    this.localStream?.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, this.localStream);
    });
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.ws?.send(JSON.stringify({ type: "ice-candidate", streamId: this.streamId, candidate: event.candidate }));
      }
    };
  }
  async createOffer(targetUserId) {
    if (!this.peerConnection)
      return;
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.ws?.send(JSON.stringify({ type: "offer", streamId: this.streamId, sdp: offer, targetUserId }));
  }
  joinStreamAsViewer(streamId) {
    this.streamId = streamId;
    this.connectSignaling(streamId, "viewer");
  }
  async handleOffer(sdp, streamId) {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });
    this.peerConnection.ontrack = (event) => {
      const remoteVideo = this.querySelector(`#remote-video-${streamId}`);
      const status = this.querySelector(`#viewer-status-${streamId}`);
      if (remoteVideo) {
        remoteVideo.srcObject = event.streams[0];
        if (status)
          status.style.display = "none";
      }
    };
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.ws?.send(JSON.stringify({ type: "ice-candidate", streamId, candidate: event.candidate }));
      }
    };
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    this.ws?.send(JSON.stringify({ type: "answer", streamId, sdp: answer }));
  }
  async stopStream(token) {
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.peerConnection?.close();
    this.ws?.close();
    await fetch(`http://localhost:3001/streams/${this.streamId}/end`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });
    const hostPanel = this.querySelector("#host-panel");
    hostPanel.style.display = "none";
    await this.loadStreams(token);
  }
  disconnectedCallback() {
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.peerConnection?.close();
    this.ws?.close();
  }
}
if (!customElements.get("only-stream")) {
  customElements.define("only-stream", OnlyStream);
}

// src/components/only-profile/profile.component.ts
class OnlyProfile extends HTMLElement {
  async connectedCallback() {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const username = localStorage.getItem("username") ?? "Hacker";
    const membership = localStorage.getItem("membership") ?? "none";
    const membershipLabels = {
      none: "\uD83D\uDD13 Sin membresía",
      gameboy: "\uD83C\uDFAE Gameboy",
      playboy: "\uD83C\uDCCF Playboy"
    };
    this.innerHTML = `
      <only-navbar></only-navbar>
      <main class="container fade-in" style="padding-top:32px;">
        <div class="profile-header">
          <div class="avatar" aria-hidden="true">\uD83D\uDC7E</div>
          <div>
            <h2>${username}</h2>
            <p class="membership-${membership}" style="margin-top:4px;">
              ${membershipLabels[membership]}
            </p>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px;">
          <div class="card">
            <h3 style="margin-bottom:16px;">Cambiar username</h3>
            <div id="username-alert" class="alert" style="display:none;"></div>
            <div class="form-group">
              <label class="form-label">Nuevo username</label>
              <input class="form-input" id="new-username" placeholder="Mínimo 8 caracteres" />
            </div>
            <button id="update-username-btn" class="btn btn-primary btn-full" style="display:none;">
              Guardar
            </button>
          </div>

          <div class="card">
            <h3 style="margin-bottom:16px;">Cambiar contraseña</h3>
            <div id="password-alert" class="alert" style="display:none;"></div>
            <div class="form-group">
              <label class="form-label">Nueva contraseña</label>
              <input class="form-input" type="password" id="new-password" placeholder="Mín. 8 caracteres, mayúscula, número y símbolo" />
            </div>
            <div class="form-group">
              <label class="form-label">Confirmar contraseña</label>
              <input class="form-input" type="password" id="confirm-password" placeholder="Repite la contraseña" />
            </div>
            <button id="change-password-btn" class="btn btn-primary btn-full">
              Cambiar contraseña
            </button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
          <div class="card">
            <h3 style="margin-bottom:16px;">Cambiar membresía</h3>
            <div id="membership-alert" class="alert" style="display:none;"></div>
            <div class="form-group">
              <label class="form-label">Selecciona un plan</label>
              <select class="form-input" id="membership-select">
                <option value="gameboy">\uD83C\uDFAE Gameboy — $9.99/mes</option>
                <option value="playboy">\uD83C\uDCCF Playboy — $19.99/mes</option>
              </select>
            </div>
            <button id="upgrade-btn" class="btn btn-primary btn-full">
              Actualizar membresía
            </button>
            ${membership !== "none" ? `
              <button id="cancel-btn" class="btn btn-danger btn-full" style="margin-top:8px;">
                Cancelar membresía
              </button>
            ` : ""}
          </div>

          <div class="card">
            <h3 style="margin-bottom:16px;">Historial de compras</h3>
            <div id="orders-list">
              <div class="loading-page"><div class="spinner"></div></div>
            </div>
          </div>
        </div>
      </main>
    `;
    await this.loadOrders(token);
    this.setupUsername(token);
    this.setupPassword(token);
    this.setupMembership(token);
  }
  async loadOrders(token) {
    const list = this.querySelector("#orders-list");
    try {
      const res = await fetch("http://localhost:3001/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.order?.length) {
        list.innerHTML = `<p style="font-size:0.875rem; color:var(--text-muted);">Sin compras aún.</p>`;
        return;
      }
      list.innerHTML = data.order.map((o) => `
        <div style="padding:8px 0; border-bottom:1px solid var(--border);">
          <p style="font-size:0.8rem; color:var(--text-muted);">Orden #${o.id}</p>
          <p style="font-size:0.875rem; color:var(--surface);">
            $${o.total.toFixed(2)} — <span style="color:var(--success)">${o.status}</span>
          </p>
        </div>
      `).join("");
    } catch {
      list.innerHTML = `<p style="color:var(--danger); font-size:0.8rem;">Error al cargar historial</p>`;
    }
  }
  setupUsername(token) {
    const alertEl = this.querySelector("#username-alert");
    const input = this.querySelector("#new-username");
    const btn = this.querySelector("#update-username-btn");
    const showAlert = (msg, type) => {
      alertEl.className = `alert alert-${type}`;
      alertEl.textContent = msg;
      alertEl.style.display = "block";
      setTimeout(() => {
        alertEl.style.display = "none";
      }, 3000);
    };
    input.addEventListener("input", () => {
      btn.style.display = input.value.trim().length >= 8 ? "block" : "none";
    });
    btn.addEventListener("click", async () => {
      const username = input.value.trim();
      if (username.length < 8) {
        showAlert("El username debe tener mínimo 8 caracteres", "error");
        return;
      }
      const res = await fetch("http://localhost:3001/profile/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username })
      });
      if (res.ok) {
        localStorage.setItem("username", username);
        input.value = "";
        btn.style.display = "none";
        showAlert("✅ Username actualizado", "success");
      } else {
        const data = await res.json();
        showAlert(data.error ?? "Error al actualizar", "error");
      }
    });
  }
  setupPassword(token) {
    const alertEl = this.querySelector("#password-alert");
    const showAlert = (msg, type) => {
      alertEl.className = `alert alert-${type}`;
      alertEl.textContent = msg;
      alertEl.style.display = "block";
      setTimeout(() => {
        alertEl.style.display = "none";
      }, 3000);
    };
    this.querySelector("#change-password-btn")?.addEventListener("click", async () => {
      const password = this.querySelector("#new-password").value;
      const confirm2 = this.querySelector("#confirm-password").value;
      if (password !== confirm2) {
        showAlert("Las contraseñas no coinciden", "error");
        return;
      }
      const res = await fetch("http://localhost:3001/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        showAlert("✅ Contraseña actualizada", "success");
        this.querySelector("#new-password").value = "";
        this.querySelector("#confirm-password").value = "";
      } else {
        const data = await res.json();
        showAlert(data.error ?? "Error al actualizar", "error");
      }
    });
  }
  setupMembership(token) {
    const alertEl = this.querySelector("#membership-alert");
    const showAlert = (msg, type) => {
      alertEl.className = `alert alert-${type}`;
      alertEl.textContent = msg;
      alertEl.style.display = "block";
      setTimeout(() => {
        alertEl.style.display = "none";
      }, 3000);
    };
    this.querySelector("#upgrade-btn")?.addEventListener("click", async () => {
      const membership = this.querySelector("#membership-select").value;
      const amount = membership === "playboy" ? 19.99 : 9.99;
      const res = await fetch("http://localhost:3001/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ membership, amount })
      });
      if (res.ok) {
        localStorage.setItem("membership", membership);
        showAlert("✅ Membresía actualizada correctamente", "success");
        setTimeout(() => navigate("/profile"), 1500);
      } else {
        showAlert("Error al actualizar membresía", "error");
      }
    });
    this.querySelector("#cancel-btn")?.addEventListener("click", async () => {
      const res = await fetch("http://localhost:3001/membership", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        localStorage.setItem("membership", "none");
        showAlert("Membresía cancelada", "success");
        setTimeout(() => navigate("/profile"), 1500);
      }
    });
  }
}
if (!customElements.get("only-profile")) {
  customElements.define("only-profile", OnlyProfile);
}

// src/components/only-admin/admin.component.ts
class OnlyAdmin extends HTMLElement {
  async connectedCallback() {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    this.innerHTML = `
      <only-navbar></only-navbar>
      <main class="container fade-in" style="padding-top:32px;">
        <h2 style="margin-bottom:24px;">Panel de Administración</h2>

        <div id="admin-alert" class="alert" style="display:none;"></div>

        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:32px;">
          <div class="card" style="text-align:center;">
            <p style="font-size:2rem; margin-bottom:8px;">\uD83D\uDC65</p>
            <h3 id="stat-users" style="font-size:1.8rem; color:var(--accent);">—</h3>
            <p>Usuarios totales</p>
          </div>
          <div class="card" style="text-align:center;">
            <p style="font-size:2rem; margin-bottom:8px;">\uD83D\uDCDD</p>
            <h3 id="stat-articles" style="font-size:1.8rem; color:var(--accent);">—</h3>
            <p>Artículos</p>
          </div>
          <div class="card" style="text-align:center;">
            <p style="font-size:2rem; margin-bottom:8px;">\uD83D\uDEE1️</p>
            <h3 id="stat-staff" style="font-size:1.8rem; color:var(--accent);">—</h3>
            <p>Staff</p>
          </div>
          <div class="card" style="text-align:center;">
            <p style="font-size:2rem; margin-bottom:8px;">\uD83D\uDCE1</p>
            <h3 id="stat-streams" style="font-size:1.8rem; color:var(--accent);">—</h3>
            <p>Streams</p>
          </div>
          <div class="card" style="text-align:center;">
            <p style="font-size:2rem; margin-bottom:8px;">\uD83C\uDFAE</p>
            <h3 id="stat-gameboy" style="font-size:1.8rem; color:var(--success);">—</h3>
            <p>Gameboy</p>
          </div>
          <div class="card" style="text-align:center;">
            <p style="font-size:2rem; margin-bottom:8px;">\uD83C\uDCCF</p>
            <h3 id="stat-playboy" style="font-size:1.8rem; color:var(--accent-hot);">—</h3>
            <p>Playboy</p>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-bottom:16px;">Gestión de usuarios</h3>
          <div id="users-list">
            <div class="skeleton-card">
              <div class="skeleton skeleton-title" style="width:40%"></div>
              <div class="skeleton skeleton-text"></div>
            </div>
            <div class="skeleton-card">
              <div class="skeleton skeleton-title" style="width:50%"></div>
              <div class="skeleton skeleton-text"></div>
            </div>
          </div>
        </div>
      </main>
    `;
    await this.loadStats(token);
    await this.loadUsers(token);
  }
  async loadStats(token) {
    try {
      const res = await fetch("http://localhost:3001/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        navigate("/feed");
        return;
      }
      const data = await res.json();
      const s = data.stats;
      this.querySelector("#stat-users").textContent = s.totalUsers;
      this.querySelector("#stat-articles").textContent = s.totalArticles;
      this.querySelector("#stat-staff").textContent = s.totalStaff;
      this.querySelector("#stat-streams").textContent = s.totalStreams;
      this.querySelector("#stat-gameboy").textContent = s.memberships.gameboy;
      this.querySelector("#stat-playboy").textContent = s.memberships.playboy;
    } catch {
      console.error("Error al cargar estadísticas");
    }
  }
  async loadUsers(token) {
    const list = this.querySelector("#users-list");
    const myId = parseInt(localStorage.getItem("userId") ?? "0");
    try {
      const res = await fetch("http://localhost:3001/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const roleColors = {
        none: "var(--text-muted)",
        staff: "var(--accent)",
        admin: "var(--accent-hot)"
      };
      list.innerHTML = `
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="border-bottom:1px solid var(--border);">
              <th style="padding:12px; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">ID</th>
              <th style="padding:12px; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Username</th>
              <th style="padding:12px; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Email</th>
              <th style="padding:12px; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Membresía</th>
              <th style="padding:12px; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Rol</th>
              <th style="padding:12px; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${data.users.map((u) => `
              <tr style="border-bottom:1px solid var(--border);">
                <td style="padding:12px; font-size:0.875rem; color:var(--text-muted);">#${u.id}</td>
                <td style="padding:12px; font-size:0.875rem; color:var(--surface); font-weight:700;">${u.username}</td>
                <td style="padding:12px; font-size:0.875rem; color:var(--text-muted);">${u.email}</td>
                <td style="padding:12px;">
                  <span class="badge badge-${u.membership}">${u.membership}</span>
                </td>
                <td style="padding:12px;">
                  <span style="color:${roleColors[u.role] ?? "var(--text-muted)"}; font-weight:700; font-size:0.875rem;">
                    ${u.role}
                  </span>
                </td>
                <td style="padding:12px; display:flex; gap:8px; align-items:center;">
                  <select class="form-input role-select" data-user-id="${u.id}"
                    style="padding:4px 8px; font-size:0.8rem; width:auto;">
                    <option value="none" ${u.role === "none" ? "selected" : ""}>none</option>
                    <option value="staff" ${u.role === "staff" ? "selected" : ""}>staff</option>
                    <option value="admin" ${u.role === "admin" ? "selected" : ""}>admin</option>
                  </select>
                  ${u.id !== myId ? `
                    <button class="btn btn-danger btn-sm delete-user-btn" data-user-id="${u.id}" data-username="${u.username}"
                      style="padding:4px 10px; font-size:0.8rem;">
                      \uD83D\uDDD1️
                    </button>
                  ` : '<span style="font-size:0.75rem; color:var(--text-muted);">Tú</span>'}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
      list.querySelectorAll(".role-select").forEach((select) => {
        select.addEventListener("change", async () => {
          const userId = parseInt(select.dataset.userId ?? "0");
          const role = select.value;
          await this.updateRole(token, userId, role);
        });
      });
      list.querySelectorAll(".delete-user-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const userId = parseInt(btn.dataset.userId ?? "0");
          const username = btn.dataset.username ?? "";
          await this.deleteUser(token, userId, username);
        });
      });
    } catch {
      list.innerHTML = `<div class="alert alert-error">Error al cargar usuarios</div>`;
    }
  }
  async updateRole(token, userId, role) {
    const alertEl = this.querySelector("#admin-alert");
    const res = await fetch(`http://localhost:3001/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role })
    });
    if (res.ok) {
      alertEl.className = "alert alert-success";
      alertEl.textContent = "✅ Rol actualizado correctamente";
      alertEl.style.display = "block";
      setTimeout(async () => {
        alertEl.style.display = "none";
        await this.loadUsers(token);
        await this.loadStats(token);
      }, 1500);
    } else {
      alertEl.className = "alert alert-error";
      alertEl.textContent = "Error al actualizar rol";
      alertEl.style.display = "block";
    }
  }
  async deleteUser(token, userId, username) {
    const alertEl = this.querySelector("#admin-alert");
    if (!confirm(`¿Estás seguro de eliminar al usuario "${username}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    const res = await fetch(`http://localhost:3001/admin/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      alertEl.className = "alert alert-success";
      alertEl.textContent = `✅ Usuario "${username}" eliminado correctamente`;
      alertEl.style.display = "block";
      setTimeout(async () => {
        alertEl.style.display = "none";
        await this.loadUsers(token);
        await this.loadStats(token);
      }, 1500);
    } else {
      const data = await res.json();
      alertEl.className = "alert alert-error";
      alertEl.textContent = data.error ?? "Error al eliminar usuario";
      alertEl.style.display = "block";
    }
  }
}
if (!customElements.get("only-admin")) {
  customElements.define("only-admin", OnlyAdmin);
}

// src/core/app.module.ts
registerRoute("/", "only-home");
registerRoute("/login", "only-login");
registerRoute("/register", "only-register");
registerRoute("/feed", "only-feed");
registerRoute("/article", "only-article");
registerRoute("/chat", "only-chat");
registerRoute("/store", "only-store");
registerRoute("/stream", "only-stream");
registerRoute("/profile", "only-profile");
registerRoute("/admin", "only-admin");
window.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    customElements.whenDefined("only-home"),
    customElements.whenDefined("only-login"),
    customElements.whenDefined("only-feed")
  ]);
  initRouter();
});
