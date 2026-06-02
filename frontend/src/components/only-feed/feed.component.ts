import { navigate } from '../../core/router.core'

class OnlyFeed extends HTMLElement {
  async connectedCallback() {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }

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
    `

    const membership = localStorage.getItem('membership') ?? 'none'
    const membershipEl = this.querySelector('#membership-info')!
    const labels: Record<string, string> = {
      none: '🔓 Sin membresía — solo contenido público',
      gameboy: '🎮 Gameboy — contenido público y de creadores',
      playboy: '🃏 Playboy — acceso completo + tips exclusivos'
    }
    membershipEl.textContent = labels[membership] ?? labels.none

    await this.loadArticles(token)

    this.querySelector('#new-article-btn')?.addEventListener('click', () => {
      if (membership === 'none') {
        alert('Necesitas una membresía para crear artículos')
        return
      }
      this.showNewArticleForm()
    })
  }

  async loadArticles(token: string) {
    const list = this.querySelector('#articles-list')!
    try {
      const res = await fetch('http://localhost:3001/content', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json() as { articles: any[] }

      if (!data.articles?.length) {
        list.innerHTML = `<div class="card"><p>No hay artículos disponibles aún.</p></div>`
        return
      }

      list.innerHTML = data.articles.map((a: any) => `
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
              💬 Ver artículo
            </button>
          </div>
        </article>
      `).join('')

      this.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          const id = (btn as HTMLElement).dataset.id ?? ''
          localStorage.setItem('currentArticleId', id)
          navigate('/article')
        })
      })

      this.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation()
          const id = (btn as HTMLElement).dataset.id
          await fetch(`http://localhost:3001/likes/${id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          })
          btn.classList.toggle('liked')
        })
      })

      this.querySelectorAll('.article-card').forEach(card => {
        card.addEventListener('click', (e) => {
          const target = e.target as HTMLElement
          if (target.closest('.action-btn')) return
          const id = (card as HTMLElement).dataset.id ?? ''
          localStorage.setItem('currentArticleId', id)
          navigate('/article')
        })
      })

    } catch {
      list.innerHTML = `<div class="alert alert-error">Error al cargar artículos</div>`
    }
  }

  showNewArticleForm() {
    const list = this.querySelector('#articles-list')!
    const form = document.createElement('div')
    form.className = 'card fade-in'
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
    `
    list.prepend(form)

    form.querySelector('#cancel-article')?.addEventListener('click', () => form.remove())
    form.querySelector('#submit-article')?.addEventListener('click', async () => {
      const token = localStorage.getItem('token')!
      const title = (form.querySelector('#new-title') as HTMLInputElement).value
      const contentType = (form.querySelector('#new-type') as HTMLSelectElement).value
      const body = (form.querySelector('#new-body') as HTMLTextAreaElement).value

      const res = await fetch('http://localhost:3001/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, contentType, body })
      })
      if (res.ok) { form.remove(); await this.loadArticles(token) }
    })
  }
}

if (!customElements.get('only-feed')) {
  customElements.define('only-feed', OnlyFeed)
}