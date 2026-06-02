import { navigate } from '../../core/router.core'

class OnlyHome extends HTMLElement {
  connectedCallback() {
    const token = localStorage.getItem('token')
    if (token) {
      navigate('/feed')
      return
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
            🔐 Comunidad privada de hacking ético
          </p>
        </div>
      </section>
    `
  }
}

if (!customElements.get('only-home')) {
  customElements.define('only-home', OnlyHome)
}