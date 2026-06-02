import { navigate } from '../../core/router.core'

class OnlyAdmin extends HTMLElement {
  async connectedCallback() {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }

    this.innerHTML = `
      <only-navbar></only-navbar>
      <main class="container fade-in" style="padding-top:32px;">
        <h2 style="margin-bottom:24px;">Panel de Administración</h2>

        <div id="admin-alert" class="alert" style="display:none;"></div>

        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:32px;">
          <div class="card" style="text-align:center;">
            <p style="font-size:2rem; margin-bottom:8px;">👥</p>
            <h3 id="stat-users" style="font-size:1.8rem; color:var(--accent);">—</h3>
            <p>Usuarios totales</p>
          </div>
          <div class="card" style="text-align:center;">
            <p style="font-size:2rem; margin-bottom:8px;">📝</p>
            <h3 id="stat-articles" style="font-size:1.8rem; color:var(--accent);">—</h3>
            <p>Artículos</p>
          </div>
          <div class="card" style="text-align:center;">
            <p style="font-size:2rem; margin-bottom:8px;">🛡️</p>
            <h3 id="stat-staff" style="font-size:1.8rem; color:var(--accent);">—</h3>
            <p>Staff</p>
          </div>
          <div class="card" style="text-align:center;">
            <p style="font-size:2rem; margin-bottom:8px;">📡</p>
            <h3 id="stat-streams" style="font-size:1.8rem; color:var(--accent);">—</h3>
            <p>Streams</p>
          </div>
          <div class="card" style="text-align:center;">
            <p style="font-size:2rem; margin-bottom:8px;">🎮</p>
            <h3 id="stat-gameboy" style="font-size:1.8rem; color:var(--success);">—</h3>
            <p>Gameboy</p>
          </div>
          <div class="card" style="text-align:center;">
            <p style="font-size:2rem; margin-bottom:8px;">🃏</p>
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
    `

    await this.loadStats(token)
    await this.loadUsers(token)
  }

  async loadStats(token: string) {
    try {
      const res = await fetch('http://localhost:3001/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.status === 401) {
        navigate('/feed')
        return
      }

      const data = await res.json() as { stats: any }
      const s = data.stats

      this.querySelector('#stat-users')!.textContent = s.totalUsers
      this.querySelector('#stat-articles')!.textContent = s.totalArticles
      this.querySelector('#stat-staff')!.textContent = s.totalStaff
      this.querySelector('#stat-streams')!.textContent = s.totalStreams
      this.querySelector('#stat-gameboy')!.textContent = s.memberships.gameboy
      this.querySelector('#stat-playboy')!.textContent = s.memberships.playboy

    } catch {
      console.error('Error al cargar estadísticas')
    }
  }

  async loadUsers(token: string) {
    const list = this.querySelector('#users-list')!
    const myId = parseInt(localStorage.getItem('userId') ?? '0')

    try {
      const res = await fetch('http://localhost:3001/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json() as { users: any[] }

      const roleColors: Record<string, string> = {
        none: 'var(--text-muted)',
        staff: 'var(--accent)',
        admin: 'var(--accent-hot)'
      }

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
            ${data.users.map((u: any) => `
              <tr style="border-bottom:1px solid var(--border);">
                <td style="padding:12px; font-size:0.875rem; color:var(--text-muted);">#${u.id}</td>
                <td style="padding:12px; font-size:0.875rem; color:var(--surface); font-weight:700;">${u.username}</td>
                <td style="padding:12px; font-size:0.875rem; color:var(--text-muted);">${u.email}</td>
                <td style="padding:12px;">
                  <span class="badge badge-${u.membership}">${u.membership}</span>
                </td>
                <td style="padding:12px;">
                  <span style="color:${roleColors[u.role] ?? 'var(--text-muted)'}; font-weight:700; font-size:0.875rem;">
                    ${u.role}
                  </span>
                </td>
                <td style="padding:12px; display:flex; gap:8px; align-items:center;">
                  <select class="form-input role-select" data-user-id="${u.id}"
                    style="padding:4px 8px; font-size:0.8rem; width:auto;">
                    <option value="none" ${u.role === 'none' ? 'selected' : ''}>none</option>
                    <option value="staff" ${u.role === 'staff' ? 'selected' : ''}>staff</option>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>admin</option>
                  </select>
                  ${u.id !== myId ? `
                    <button class="btn btn-danger btn-sm delete-user-btn" data-user-id="${u.id}" data-username="${u.username}"
                      style="padding:4px 10px; font-size:0.8rem;">
                      🗑️
                    </button>
                  ` : '<span style="font-size:0.75rem; color:var(--text-muted);">Tú</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `

      list.querySelectorAll('.role-select').forEach(select => {
        select.addEventListener('change', async () => {
          const userId = parseInt((select as HTMLElement).dataset.userId ?? '0')
          const role = (select as HTMLSelectElement).value
          await this.updateRole(token, userId, role)
        })
      })

      list.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const userId = parseInt((btn as HTMLElement).dataset.userId ?? '0')
          const username = (btn as HTMLElement).dataset.username ?? ''
          await this.deleteUser(token, userId, username)
        })
      })

    } catch {
      list.innerHTML = `<div class="alert alert-error">Error al cargar usuarios</div>`
    }
  }

  async updateRole(token: string, userId: number, role: string) {
    const alertEl = this.querySelector('#admin-alert') as HTMLElement

    const res = await fetch(`http://localhost:3001/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ role })
    })

    if (res.ok) {
      alertEl.className = 'alert alert-success'
      alertEl.textContent = '✅ Rol actualizado correctamente'
      alertEl.style.display = 'block'
      setTimeout(async () => {
        alertEl.style.display = 'none'
        await this.loadUsers(token)
        await this.loadStats(token)
      }, 1500)
    } else {
      alertEl.className = 'alert alert-error'
      alertEl.textContent = 'Error al actualizar rol'
      alertEl.style.display = 'block'
    }
  }

  async deleteUser(token: string, userId: number, username: string) {
    const alertEl = this.querySelector('#admin-alert') as HTMLElement

    if (!confirm(`¿Estás seguro de eliminar al usuario "${username}"? Esta acción no se puede deshacer.`)) {
      return
    }

    const res = await fetch(`http://localhost:3001/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (res.ok) {
      alertEl.className = 'alert alert-success'
      alertEl.textContent = `✅ Usuario "${username}" eliminado correctamente`
      alertEl.style.display = 'block'
      setTimeout(async () => {
        alertEl.style.display = 'none'
        await this.loadUsers(token)
        await this.loadStats(token)
      }, 1500)
    } else {
      const data = await res.json() as { error: string }
      alertEl.className = 'alert alert-error'
      alertEl.textContent = data.error ?? 'Error al eliminar usuario'
      alertEl.style.display = 'block'
    }
  }
}

if (!customElements.get('only-admin')) {
  customElements.define('only-admin', OnlyAdmin)
}