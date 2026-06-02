import { navigate } from '../../core/router.core'

class OnlyStore extends HTMLElement {
  async connectedCallback() {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }

    this.innerHTML = `
      <only-navbar></only-navbar>
      <main class="container fade-in" style="padding-top:32px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:32px;">
          <h2>Tienda</h2>
          <button id="cart-btn" class="btn btn-secondary btn-sm">
            🛒 Carrito (<span id="cart-count">0</span>)
          </button>
        </div>

        <div id="cart-alert" class="alert alert-success" style="display:none;"></div>

        <div id="products-grid" class="store-grid">
          <div class="skeleton-card">
            <div class="skeleton" style="height:180px; border-radius:12px; margin-bottom:16px;"></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width:40%"></div>
          </div>
          <div class="skeleton-card">
            <div class="skeleton" style="height:180px; border-radius:12px; margin-bottom:16px;"></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width:40%"></div>
          </div>
          <div class="skeleton-card">
            <div class="skeleton" style="height:180px; border-radius:12px; margin-bottom:16px;"></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width:40%"></div>
          </div>
        </div>
      </main>
    `

    await this.loadProducts(token)

    this.querySelector('#cart-btn')?.addEventListener('click', async () => {
      await this.processOrder(token)
    })
  }

  async loadProducts(token: string) {
    const grid = this.querySelector('#products-grid')!
    try {
      const res = await fetch('http://localhost:3001/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json() as { products: any[] }

      if (!data.products?.length) {
        grid.innerHTML = `<div class="card"><p>No hay productos disponibles.</p></div>`
        return
      }

      grid.innerHTML = data.products.map((p: any) => `
        <article class="product-card fade-in" aria-label="${p.name}">
          <div class="product-img" aria-hidden="true">🛡️</div>
          <div class="product-info">
            <h3 class="product-name">${p.name}</h3>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px;">${p.description}</p>
            <p class="product-price">$${p.price.toFixed(2)}</p>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:12px;">
              Stock: ${p.stock}
            </p>
            <button class="btn btn-primary btn-sm btn-full add-cart-btn"
              data-id="${p.id}" data-name="${p.name}">
              Agregar al carrito
            </button>
          </div>
        </article>
      `).join('')

      this.querySelectorAll('.add-cart-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const productId = parseInt((btn as HTMLElement).dataset.id ?? '0')
          await this.addToCart(token, productId)
        })
      })

    } catch {
      grid.innerHTML = `<div class="alert alert-error">Error al cargar productos</div>`
    }
  }

  async addToCart(token: string, productId: number) {
    const res = await fetch('http://localhost:3001/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ product_id: productId, quantity: 1 })
    })
    if (res.ok) {
      const count = this.querySelector('#cart-count')!
      count.textContent = String(parseInt(count.textContent ?? '0') + 1)
    }
  }

  async processOrder(token: string) {
    const alert = this.querySelector('#cart-alert') as HTMLElement
    const res = await fetch('http://localhost:3001/orders', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      alert.textContent = '✅ Orden procesada correctamente'
      alert.style.display = 'block';
      (this.querySelector('#cart-count') as HTMLElement).textContent = '0'
      setTimeout(() => { alert.style.display = 'none' }, 3000)
    } else {
      alert.className = 'alert alert-error'
      alert.textContent = 'El carrito está vacío'
      alert.style.display = 'block'
      setTimeout(() => { alert.style.display = 'none' }, 3000)
    }
  }
}

if (!customElements.get('only-store')) {
  customElements.define('only-store', OnlyStore)
}