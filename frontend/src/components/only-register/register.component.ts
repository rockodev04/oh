import { navigate } from '../../core/router.core'

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
    `

    this.querySelector('#register-form')?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const errorEl = this.querySelector('#register-error') as HTMLElement
      const successEl = this.querySelector('#register-success') as HTMLElement
      const submitBtn = this.querySelector('button[type="submit"]') as HTMLButtonElement

      const username = (this.querySelector('#reg-username') as HTMLInputElement).value.trim()
      const email = (this.querySelector('#reg-email') as HTMLInputElement).value.trim()
      const password = (this.querySelector('#reg-password') as HTMLInputElement).value

      errorEl.style.display = 'none'
      successEl.style.display = 'none'
      submitBtn.textContent = 'Creando cuenta...'
      submitBtn.disabled = true

      try {
        const res = await fetch('http://localhost:3001/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        })

        const data = await res.json()

        if (!res.ok) {
          errorEl.textContent = data.error ?? 'Error al crear la cuenta'
          errorEl.style.display = 'block'
          return
        }

        successEl.textContent = '¡Cuenta creada! Redirigiendo...'
        successEl.style.display = 'block'
        setTimeout(() => navigate('/login'), 1500)

      } catch {
        errorEl.textContent = 'Error de conexión con el servidor'
        errorEl.style.display = 'block'
      } finally {
        submitBtn.textContent = 'Crear cuenta'
        submitBtn.disabled = false
      }
    })
  }
}

if (!customElements.get('only-register')) {
  customElements.define('only-register', OnlyRegister)
}