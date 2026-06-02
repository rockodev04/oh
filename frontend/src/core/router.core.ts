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
  window.history.pushState({}, "", path)
  renderRoute(path)
}

function renderRoute(path: string): void {
  const component = routes[path] ?? routes["/"]
  const app = document.getElementById("app")
  if (!app) return

  if (path === '/article') {
    const id = localStorage.getItem('currentArticleId') ?? ''
    app.innerHTML = `<${component} article-id="${id}"></${component}>`
    return
  }

  app.innerHTML = `<${component}></${component}>`
}

export function initRouter(): void {
  window.addEventListener("popstate", () => {
    renderRoute(window.location.pathname)
  })

  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement
    const link = target.closest("[data-link]") as HTMLAnchorElement
    if (!link) return
    e.preventDefault()
    navigate(link.getAttribute("href") ?? "/")
  })

  renderRoute(window.location.pathname)
}