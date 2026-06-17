// ============================================
// router.core.ts — Magic Router
// ============================================

const routes: Record<string, string> = {}

export function registerRoute(path: string, component: string): void {
  routes[path] = component
}

export function defineComponent(name: string, component: CustomElementConstructor): void {
  if (!customElements.get(name)) {
    customElements.define(name, component)
  }
}

export function navigate(path: string): void {
  window.history.pushState({}, '', path)
  renderRoute(path)
}

// ✅ Navegar a página de error sin hardcodear en cada componente
export function navigateToError(code: '401' | '403' | '404' | '500'): void {
  const app = document.getElementById('app')
  if (!app) return
  app.innerHTML = `<only-error code="${code}"></only-error>`
}

function renderRoute(path: string): void {
  const component = routes[path]
  const app = document.getElementById('app')
  if (!app) return

  // ✅ Ruta desconocida — muestra 404 automáticamente
  if (!component) {
    app.innerHTML = `<only-error code="404"></only-error>`
    return
  }

  if (path === '/article') {
    const id = localStorage.getItem('currentArticleId') ?? ''
    app.innerHTML = `<${component} article-id="${id}"></${component}>`
    return
  }

  app.innerHTML = `<${component}></${component}>`
}

export function initRouter(): void {
  window.addEventListener('popstate', () => {
    renderRoute(window.location.pathname)
  })

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const link = target.closest('[data-link]') as HTMLAnchorElement
    if (!link) return
    e.preventDefault()
    navigate(link.getAttribute('href') ?? '/')
  })

  renderRoute(window.location.pathname)
}
