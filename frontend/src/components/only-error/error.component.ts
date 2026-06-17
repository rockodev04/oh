// ============================================
// error.component.ts — Only Error
// Página de error con código HTTP configurable
// ============================================

import { navigate } from '../../core/router.core'

const ERROR_CONFIG: Record<string, { code: string, title: string, message: string, icon: string }> = {
  '404': {
    code: '404',
    title: 'Página no encontrada',
    message: 'La ruta que buscas no existe o fue eliminada.',
    icon: '🔍'
  },
  '401': {
    code: '401',
    title: 'No autorizado',
    message: 'Necesitas iniciar sesión para acceder a este contenido.',
    icon: '🔒'
  },
  '403': {
    code: '403',
    title: 'Acceso denegado',
    message: 'No tienes permisos suficientes para ver esta página.',
    icon: '🚫'
  },
  '500': {
    code: '500',
    title: 'Error del servidor',
    message: 'Algo salió mal en el servidor. Intenta de nuevo más tarde.',
    icon: '💥'
  }
}

class OnlyError extends HTMLElement {
  connectedCallback() {
    const code = this.getAttribute('code') ?? '404'
    const config = ERROR_CONFIG[code] ?? ERROR_CONFIG['404']
    const token = localStorage.getItem('token')

    this.innerHTML = `
      <only-navbar></only-navbar>
      <main class="container fade-in" style="
        display:flex; flex-direction:column; align-items:center;
        justify-content:center; min-height:70vh; text-align:center; gap:16px;
      ">
        <p style="font-size:4rem;">${config.icon}</p>
        <h1 style="font-size:5rem; font-weight:900; color:var(--accent); line-height:1;">
          ${config.code}
        </h1>
        <h2 style="font-size:1.5rem;">${config.title}</h2>
        <p style="color:var(--text-muted); max-width:400px;">${config.message}</p>
        <div style="display:flex; gap:12px; margin-top:8px;">
          ${code === '401' ? `
            <button id="go-login" class="btn btn-primary">Iniciar sesión</button>
          ` : ''}
          <button id="go-back" class="btn btn-secondary">
            ${token ? 'Ir al feed' : 'Ir al inicio'}
          </button>
        </div>
      </main>
    `

    this.querySelector('#go-login')?.addEventListener('click', () => navigate('/login'))
    this.querySelector('#go-back')?.addEventListener('click', () => {
      navigate(token ? '/feed' : '/')
    })
  }
}

if (!customElements.get('only-error')) {
  customElements.define('only-error', OnlyError)
}
