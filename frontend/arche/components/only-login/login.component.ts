import { navigate } from '../../core/router.core'

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
    `

    this.querySelector('#login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const errorEl = this.querySelector('#login-error') as HTMLElement
      const submitBtn = this.querySelector('button[type="submit"]') as HTMLButtonElement
      const email = (this.querySelector('#login-email') as HTMLInputElement).value.trim()
      const password = (this.querySelector('#login-password') as HTMLInputElement).value

      errorEl.style.display = 'none'
      submitBtn.textContent = 'Ingresando...'
      submitBtn.disabled = true

      try {
        const res = await fetch('http://localhost:3001/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })

        const data = await res.json() as { 
          token: string, 
          membership: string, 
          username: string, 
          userId: number,
          role: string,
          error?: string 
        }

        if (!res.ok) {
          errorEl.textContent = data.error ?? 'Credenciales incorrectas'
          errorEl.style.display = 'block'
          return
        }

        localStorage.setItem('token', data.token)
        localStorage.setItem('membership', data.membership ?? 'none')
        localStorage.setItem('username', data.username ?? 'Hacker')
        localStorage.setItem('userId', String(data.userId ?? '0'))
        localStorage.setItem('role', data.role ?? 'none')
        navigate('/feed')

      } catch {
        errorEl.textContent = 'Error de conexión con el servidor'
        errorEl.style.display = 'block'
      } finally {
        submitBtn.textContent = 'Iniciar sesión'
        submitBtn.disabled = false
      }
    })
  }
}

if (!customElements.get('only-login')) {
  customElements.define('only-login', OnlyLogin)
}