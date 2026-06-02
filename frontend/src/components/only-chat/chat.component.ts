import { navigate } from '../../core/router.core'

class OnlyChat extends HTMLElement {
  async connectedCallback() {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }

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
    `

    await this.loadMessages(token)
    this.setupSend(token)
    this.setupNewChat(token)
  }

  async loadMessages(token: string) {
    const list = this.querySelector('#conversations-list')!
    try {
      const res = await fetch('http://localhost:3001/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json() as { messages: any[] }

      if (!data.messages?.length) {
        list.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted);">Sin mensajes aún</p>`
        return
      }

      const myId = parseInt(localStorage.getItem('userId') ?? '0')
      const conversations = new Map<number, any>()
      
      data.messages.forEach((m: any) => {
        const otherId = m.sender_id === myId ? m.receiver_id : m.sender_id
        const otherName = m.sender_id === myId ? `Usuario #${m.receiver_id}` : (m.sender_username ?? `Usuario #${m.sender_id}`)
        if (!conversations.has(otherId)) {
          conversations.set(otherId, { id: otherId, name: otherName, lastMessage: m.content })
        }
      })

      list.innerHTML = Array.from(conversations.values()).map(c => `
        <div class="card fade-in conversation-item" data-user-id="${c.id}" style="padding:12px; margin-bottom:8px; cursor:pointer;">
          <p style="font-size:0.8rem; color:var(--accent); font-weight:700;">${c.name}</p>
          <p style="font-size:0.8rem; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.lastMessage}</p>
        </div>
      `).join('')

      this.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', () => {
          const userId = parseInt((item as HTMLElement).dataset.userId ?? '0')
          const userName = item.querySelector('p')?.textContent ?? `Usuario #${userId}`
          this.showConversation(data.messages, userId, userName, token)
          
          const receiverInput = this.querySelector('#receiver-id') as HTMLInputElement
          const msgInput = this.querySelector('#message-input') as HTMLInputElement
          const sendBtn = this.querySelector('#send-btn') as HTMLButtonElement
          receiverInput.value = userId.toString()
          msgInput.disabled = false
          sendBtn.disabled = false
        })
      })

    } catch {
      list.innerHTML = `<p style="color:var(--danger); font-size:0.8rem;">Error al cargar mensajes</p>`
    }
  }

  showConversation(messages: any[], userId: number, userName: string, token: string) {
    const header = this.querySelector('#chat-header') as HTMLElement
    const chatWith = this.querySelector('#chat-with') as HTMLElement
    header.style.display = 'block'
    chatWith.textContent = userName

    const myId = parseInt(localStorage.getItem('userId') ?? '0')
    const filtered = messages.filter(m =>
      (m.sender_id === userId && m.receiver_id === myId) ||
      (m.sender_id === myId && m.receiver_id === userId)
    )
    this.renderMessages(filtered, token)
  }

  renderMessages(messages: any[], token: string) {
    const container = this.querySelector('#chat-messages')!
    const myId = parseInt(localStorage.getItem('userId') ?? '0')

    if (!messages.length) {
      container.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--text-muted); font-size:0.875rem;">
          Sin mensajes aún
        </div>`
      return
    }

    container.innerHTML = messages.map((m: any) => {
      const isOwn = m.sender_id === myId
      return `
        <div class="message ${isOwn ? 'own' : ''}" role="article" data-id="${m.id}">
          <div class="message-bubble">
            ${m.content}
            ${isOwn ? `
              <div style="display:flex; gap:6px; margin-top:6px; justify-content:flex-end;">
                <button class="action-btn edit-msg-btn" data-id="${m.id}" data-content="${m.content}" style="font-size:0.7rem; padding:2px 6px;">✏️</button>
                <button class="action-btn delete-msg-btn" data-id="${m.id}" style="font-size:0.7rem; padding:2px 6px; color:var(--danger);">🗑️</button>
              </div>
            ` : ''}
          </div>
        </div>
      `
    }).join('')

    container.scrollTop = container.scrollHeight

    container.querySelectorAll('.delete-msg-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = (btn as HTMLElement).dataset.id
        const res = await fetch(`http://localhost:3001/messages/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
  const receiverId = parseInt((this.querySelector('#receiver-id') as HTMLInputElement).value)
  const chatWith = this.querySelector('#chat-with')?.textContent ?? ''
  await this.loadMessages(token)
  
  const allMessages = await fetch('http://localhost:3001/messages', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json()) as { messages: any[] }
  
  this.showConversation(allMessages.messages, receiverId, chatWith, token)
}
      })
    })

    container.querySelectorAll('.edit-msg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.id
        const content = (btn as HTMLElement).dataset.content ?? ''
        const input = this.querySelector('#message-input') as HTMLInputElement
        input.value = content
        input.focus()
        input.dataset.editId = id
      })
    })
  }

  setupSend(token: string) {
    const input = this.querySelector('#message-input') as HTMLInputElement
    const btn = this.querySelector('#send-btn') as HTMLButtonElement

    const send = async () => {
      const content = input.value.trim()
      const receiverId = parseInt((this.querySelector('#receiver-id') as HTMLInputElement).value)
      const editId = input.dataset.editId

      if (!content) return

      if (editId) {
        const res = await fetch(`http://localhost:3001/messages/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ content })
        })
        if (res.ok) {
  input.value = ''
  delete input.dataset.editId
  await this.loadMessages(token)
  
  // Reabrir la conversación activa
  const receiverId = parseInt((this.querySelector('#receiver-id') as HTMLInputElement).value)
  const chatWith = this.querySelector('#chat-with')?.textContent ?? ''
  const allMessages = await fetch('http://localhost:3001/messages', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json()) as { messages: any[] }
  
  this.showConversation(allMessages.messages, receiverId, chatWith, token)
}
        return
      }

      if (!receiverId) return

      const res = await fetch('http://localhost:3001/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ receiver_id: receiverId, content })
      })

      if (res.ok) {
        input.value = ''
        await this.loadMessages(token)
        const container = this.querySelector('#chat-messages')!
        container.scrollTop = container.scrollHeight
      }
    }

    btn.addEventListener('click', send)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') send()
    })
  }

  setupNewChat(token: string) {
    this.querySelector('#start-chat-btn')?.addEventListener('click', () => {
      const receiverId = parseInt((this.querySelector('#receiver-id') as HTMLInputElement).value)
      const input = this.querySelector('#message-input') as HTMLInputElement
      const btn = this.querySelector('#send-btn') as HTMLButtonElement

      if (!receiverId) {
        alert('Escribe el ID del usuario primero')
        return
      }

      const header = this.querySelector('#chat-header') as HTMLElement
      const chatWith = this.querySelector('#chat-with') as HTMLElement
      header.style.display = 'block'
      chatWith.textContent = `Usuario #${receiverId}`

      input.disabled = false
      btn.disabled = false
      input.focus()
    })
  }
}

if (!customElements.get('only-chat')) {
  customElements.define('only-chat', OnlyChat)
}