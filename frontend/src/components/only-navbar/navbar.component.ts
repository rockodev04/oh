import { navigate } from '../../core/router.core'

class OnlyNavbar extends HTMLElement {
  connectedCallback() {
    const membership = localStorage.getItem('membership') ?? 'none'
    const username = localStorage.getItem('username') ?? 'Hacker'
    const role = localStorage.getItem('role') ?? 'none'

    this.innerHTML = `
      <nav class="navbar" aria-label="Navegación principal">
        <a href="/" data-link class="navbar-brand">Only<span>Hackers</span></a>
        <ul class="navbar-nav">
          <li><a href="/feed" data-link>Feed</a></li>
          <li><a href="/chat" data-link>Chat</a></li>
          <li><a href="/store" data-link>Tienda</a></li>
          <li><a href="/stream" data-link>Streaming</a></li>
          ${role === 'admin' || role === 'staff' ? `<li><a href="/admin" data-link>Admin</a></li>` : ''}
          <li>
            <a href="/profile" data-link>
              <span class="membership-${membership}">${username}</span>
            </a>
          </li>
        </ul>
        <button id="logout-btn" class="btn btn-secondary btn-sm">Salir</button>
      </nav>
    `

    this.querySelector('#logout-btn')?.addEventListener('click', () => {
      localStorage.clear()
      navigate('/login')
    })

    const current = window.location.pathname
    this.querySelectorAll('.navbar-nav a').forEach(link => {
      if (link.getAttribute('href') === current) {
        link.classList.add('active')
      }
    })
  }
}

if (!customElements.get('only-navbar')) {
  customElements.define('only-navbar', OnlyNavbar)
}