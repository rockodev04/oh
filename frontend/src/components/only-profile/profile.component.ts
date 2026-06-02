import { navigate } from '../../core/router.core'

class OnlyProfile extends HTMLElement {
  async connectedCallback() {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }

    const username = localStorage.getItem('username') ?? 'Hacker'
    const membership = localStorage.getItem('membership') ?? 'none'

    const membershipLabels: Record<string, string> = {
      none: '🔓 Sin membresía',
      gameboy: '🎮 Gameboy',
      playboy: '🃏 Playboy'
    }

    this.innerHTML = `
      <only-navbar></only-navbar>
      <main class="container fade-in" style="padding-top:32px;">
        <div class="profile-header">
          <div class="avatar" aria-hidden="true">👾</div>
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
                <option value="gameboy">🎮 Gameboy — $9.99/mes</option>
                <option value="playboy">🃏 Playboy — $19.99/mes</option>
              </select>
            </div>
            <button id="upgrade-btn" class="btn btn-primary btn-full">
              Actualizar membresía
            </button>
            ${membership !== 'none' ? `
              <button id="cancel-btn" class="btn btn-danger btn-full" style="margin-top:8px;">
                Cancelar membresía
              </button>
            ` : ''}
          </div>

          <div class="card">
            <h3 style="margin-bottom:16px;">Historial de compras</h3>
            <div id="orders-list">
              <div class="loading-page"><div class="spinner"></div></div>
            </div>
          </div>
        </div>
      </main>
    `

    await this.loadOrders(token)
    this.setupUsername(token)
    this.setupPassword(token)
    this.setupMembership(token)
  }

  async loadOrders(token: string) {
    const list = this.querySelector('#orders-list')!
    try {
      const res = await fetch('http://localhost:3001/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json() as { order: any[] }

      if (!data.order?.length) {
        list.innerHTML = `<p style="font-size:0.875rem; color:var(--text-muted);">Sin compras aún.</p>`
        return
      }

      list.innerHTML = data.order.map((o: any) => `
        <div style="padding:8px 0; border-bottom:1px solid var(--border);">
          <p style="font-size:0.8rem; color:var(--text-muted);">Orden #${o.id}</p>
          <p style="font-size:0.875rem; color:var(--surface);">
            $${o.total.toFixed(2)} — <span style="color:var(--success)">${o.status}</span>
          </p>
        </div>
      `).join('')

    } catch {
      list.innerHTML = `<p style="color:var(--danger); font-size:0.8rem;">Error al cargar historial</p>`
    }
  }

  setupUsername(token: string) {
    const alertEl = this.querySelector('#username-alert') as HTMLElement
    const input = this.querySelector('#new-username') as HTMLInputElement
    const btn = this.querySelector('#update-username-btn') as HTMLElement

    const showAlert = (msg: string, type: 'success' | 'error') => {
      alertEl.className = `alert alert-${type}`
      alertEl.textContent = msg
      alertEl.style.display = 'block'
      setTimeout(() => { alertEl.style.display = 'none' }, 3000)
    }

    input.addEventListener('input', () => {
      btn.style.display = input.value.trim().length >= 8 ? 'block' : 'none'
    })

    btn.addEventListener('click', async () => {
      const username = input.value.trim()
      if (username.length < 8) {
        showAlert('El username debe tener mínimo 8 caracteres', 'error')
        return
      }

      const res = await fetch('http://localhost:3001/profile/username', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ username })
      })

      if (res.ok) {
        localStorage.setItem('username', username)
        input.value = ''
        btn.style.display = 'none'
        showAlert('✅ Username actualizado', 'success')
      } else {
        const data = await res.json() as { error: string }
        showAlert(data.error ?? 'Error al actualizar', 'error')
      }
    })
  }

  setupPassword(token: string) {
    const alertEl = this.querySelector('#password-alert') as HTMLElement

    const showAlert = (msg: string, type: 'success' | 'error') => {
      alertEl.className = `alert alert-${type}`
      alertEl.textContent = msg
      alertEl.style.display = 'block'
      setTimeout(() => { alertEl.style.display = 'none' }, 3000)
    }

    this.querySelector('#change-password-btn')?.addEventListener('click', async () => {
      const password = (this.querySelector('#new-password') as HTMLInputElement).value
      const confirm = (this.querySelector('#confirm-password') as HTMLInputElement).value

      if (password !== confirm) {
        showAlert('Las contraseñas no coinciden', 'error')
        return
      }

      const res = await fetch('http://localhost:3001/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ password })
      })

      if (res.ok) {
        showAlert('✅ Contraseña actualizada', 'success');
        (this.querySelector('#new-password') as HTMLInputElement).value = '';
        (this.querySelector('#confirm-password') as HTMLInputElement).value = ''
      } else {
        const data = await res.json() as { error: string }
        showAlert(data.error ?? 'Error al actualizar', 'error')
      }
    })
  }

  setupMembership(token: string) {
    const alertEl = this.querySelector('#membership-alert') as HTMLElement

    const showAlert = (msg: string, type: 'success' | 'error') => {
      alertEl.className = `alert alert-${type}`
      alertEl.textContent = msg
      alertEl.style.display = 'block'
      setTimeout(() => { alertEl.style.display = 'none' }, 3000)
    }

    this.querySelector('#upgrade-btn')?.addEventListener('click', async () => {
      const membership = (this.querySelector('#membership-select') as HTMLSelectElement).value
      const amount = membership === 'playboy' ? 19.99 : 9.99

      const res = await fetch('http://localhost:3001/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ membership, amount })
      })

      if (res.ok) {
        localStorage.setItem('membership', membership)
        showAlert('✅ Membresía actualizada correctamente', 'success')
        setTimeout(() => navigate('/profile'), 1500)
      } else {
        showAlert('Error al actualizar membresía', 'error')
      }
    })

    this.querySelector('#cancel-btn')?.addEventListener('click', async () => {
      const res = await fetch('http://localhost:3001/membership', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        localStorage.setItem('membership', 'none')
        showAlert('Membresía cancelada', 'success')
        setTimeout(() => navigate('/profile'), 1500)
      }
    })
  }
}

if (!customElements.get('only-profile')) {
  customElements.define('only-profile', OnlyProfile)
}