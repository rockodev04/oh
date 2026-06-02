import { navigate } from '../../core/router.core'

class OnlyArticle extends HTMLElement {
  async connectedCallback() {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }

    const articleId = this.getAttribute('article-id')
    if (!articleId) { navigate('/feed'); return }

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
    `

    this.querySelector('#back-btn')?.addEventListener('click', () => navigate('/feed'))

    await this.loadArticle(token, parseInt(articleId))
    await this.loadComments(token, parseInt(articleId))
    this.setupComment(token, parseInt(articleId))
  }

  async loadArticle(token: string, id: number) {
    const container = this.querySelector('#article-content')!
    try {
      const res = await fetch(`http://localhost:3001/articles/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        container.innerHTML = `<div class="alert alert-error">Artículo no encontrado</div>`
        return
      }

      const article = await res.json() as any
      const userId = parseInt(localStorage.getItem('userId') ?? '0')
      const isOwner = article.created_by === userId

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
            ` : ''}
          </div>
        </article>
      `

      this.querySelector('.like-btn')?.addEventListener('click', async () => {
        await fetch(`http://localhost:3001/likes/${id}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const btn = this.querySelector('.like-btn') as HTMLElement
        btn.classList.toggle('liked')
      })

      this.querySelector('#delete-article-btn')?.addEventListener('click', async () => {
        const res = await fetch(`http://localhost:3001/articles/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) navigate('/feed')
      })

    } catch {
      container.innerHTML = `<div class="alert alert-error">Error al cargar el artículo</div>`
    }
  }

  async loadComments(token: string, articleId: number) {
    const list = this.querySelector('#comments-list')!
    try {
      const res = await fetch(`http://localhost:3001/comments/${articleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json() as { comment: any[] }

      if (!data.comment?.length) {
        list.innerHTML = `<p style="color:var(--text-muted); font-size:0.875rem;">Sin comentarios aún. ¡Sé el primero!</p>`
        return
      }

      const userId = parseInt(localStorage.getItem('userId') ?? '0')

      list.innerHTML = data.comment.map((c: any) => `
        <div class="card fade-in" style="padding:16px; margin-bottom:8px;">
          <p style="font-size:0.875rem; color:var(--surface); margin-bottom:8px;">${c.content}</p>
          <div style="display:flex; gap:8px; align-items:center;">
            <span style="font-size:0.75rem; color:var(--text-muted);">Usuario #${c.user_id}</span>
            ${c.user_id === userId ? `
              <button class="action-btn delete-comment-btn" data-id="${c.id}" style="font-size:0.75rem;">
                Eliminar
              </button>
            ` : ''}
          </div>
        </div>
      `).join('')

      this.querySelectorAll('.delete-comment-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const commentId = parseInt((btn as HTMLElement).dataset.id ?? '0')
          const res = await fetch(`http://localhost:3001/comments/${commentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (res.ok) await this.loadComments(token, articleId)
        })
      })

    } catch {
      list.innerHTML = `<p style="color:var(--danger); font-size:0.8rem;">Error al cargar comentarios</p>`
    }
  }

  setupComment(token: string, articleId: number) {
    this.querySelector('#submit-comment-btn')?.addEventListener('click', async () => {
      const input = this.querySelector('#comment-input') as HTMLTextAreaElement
      const content = input.value.trim()
      if (!content) return

      const res = await fetch('http://localhost:3001/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ article_id: articleId, content })
      })

      if (res.ok) {
        input.value = ''
        await this.loadComments(token, articleId)
      }
    })
  }
}

if (!customElements.get('only-article')) {
  customElements.define('only-article', OnlyArticle)
}