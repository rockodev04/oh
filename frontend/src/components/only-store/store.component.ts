import { navigate } from '../../core/router.core'

class OnlyStore extends HTMLElement {
  async connectedCallback() {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }

    const role = localStorage.getItem('role') ?? 'none'
    const isStaff = role === 'staff' || role === 'admin'

    this.innerHTML = `
      <only-navbar></only-navbar>
      <main class="container fade-in" style="padding-top:32px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:32px;">
          <h2>Tienda</h2>
          <div style="display:flex; gap:8px;">
            ${isStaff ? `
              <button id="new-product-btn" class="btn btn-secondary btn-sm">+ Nuevo producto</button>
            ` : ''}
            <button id="cart-btn" class="btn btn-primary btn-sm">
              🛒 Carrito (<span id="cart-count">0</span>)
            </button>
          </div>
        </div>

        <div id="cart-alert" class="alert alert-success" style="display:none;"></div>

        <div id="new-product-form" style="display:none;" class="card fade-in" style="margin-bottom:24px;">
          <h3 style="margin-bottom:16px;">Nuevo producto</h3>
          <div class="form-group">
            <label class="form-label">Nombre</label>
            <input class="form-input" id="product-name" placeholder="Nombre del producto" />
          </div>
          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea class="form-input" id="product-description" rows="3" placeholder="Descripción..."></textarea>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div class="form-group">
              <label class="form-label">Precio</label>
              <input class="form-input" id="product-price" type="number" step="0.01" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label class="form-label">Stock</label>
              <input class="form-input" id="product-stock" type="number" placeholder="0" />
            </div>
          </div>
          <div style="display:flex; gap:8px;">
            <button id="save-product-btn" class="btn btn-primary btn-sm">Guardar</button>
            <button id="cancel-product-btn" class="btn btn-secondary btn-sm">Cancelar</button>
          </div>
        </div>

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

    await this.loadProducts(token, isStaff)

    // Carrito
    this.querySelector('#cart-btn')?.addEventListener('click', async () => {
      await this.processOrder(token)
    })

    // Nuevo producto
    if (isStaff) {
      this.querySelector('#new-product-btn')?.addEventListener('click', () => {
        const form = this.querySelector('#new-product-form') as HTMLElement
        form.style.display = form.style.display === 'none' ? 'block' : 'none'
      })

      this.querySelector('#cancel-product-btn')?.addEventListener('click', () => {
        const form = this.querySelector('#new-product-form') as HTMLElement
        form.style.display = 'none'
        this.clearProductForm()
      })

      this.querySelector('#save-product-btn')?.addEventListener('click', async () => {
        await this.saveProduct(token)
      })
    }
  }

  clearProductForm() {
    ; (this.querySelector('#product-name') as HTMLInputElement).value = ''
      ; (this.querySelector('#product-description') as HTMLTextAreaElement).value = ''
      ; (this.querySelector('#product-price') as HTMLInputElement).value = ''
      ; (this.querySelector('#product-stock') as HTMLInputElement).value = ''
  }

  async saveProduct(token: string) {
    const name = (this.querySelector('#product-name') as HTMLInputElement).value.trim()
    const description = (this.querySelector('#product-description') as HTMLTextAreaElement).value.trim()
    const price = parseFloat((this.querySelector('#product-price') as HTMLInputElement).value)
    const stock = parseInt((this.querySelector('#product-stock') as HTMLInputElement).value)

    if (!name || !description || isNaN(price) || isNaN(stock)) {
      alert('Todos los campos son obligatorios')
      return
    }

    const role = localStorage.getItem('role') ?? 'none'
    const isStaff = role === 'staff' || role === 'admin'

    const res = await fetch('http://localhost:3001/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name, description, price, stock })
    })

    if (res.ok) {
      const form = this.querySelector('#new-product-form') as HTMLElement
      form.style.display = 'none'
      this.clearProductForm()
      await this.loadProducts(token, isStaff)
    } else {
      alert('Error al crear el producto')
    }
  }

  async loadProducts(token: string, isStaff: boolean) {
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
            <p class="product-price">$${parseFloat(p.price).toFixed(2)}</p>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:12px;">Stock: ${p.stock}</p>

            ${isStaff ? `
              <div id="edit-form-${p.id}" style="display:none;" class="fade-in">
                <div class="form-group">
                  <label class="form-label">Nombre</label>
                  <input class="form-input edit-name" value="${p.name}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Descripción</label>
                  <textarea class="form-input edit-description" rows="2">${p.description}</textarea>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                  <div class="form-group">
                    <label class="form-label">Precio</label>
                    <input class="form-input edit-price" type="number" step="0.01" value="${p.price}" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Stock</label>
                    <input class="form-input edit-stock" type="number" value="${p.stock}" />
                  </div>
                </div>
                <div style="display:flex; gap:8px; margin-bottom:8px;">
                  <button class="btn btn-primary btn-sm save-edit-btn" data-id="${p.id}">Guardar</button>
                  <button class="btn btn-secondary btn-sm cancel-edit-btn" data-id="${p.id}">Cancelar</button>
                </div>
              </div>
            ` : ''}

            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn btn-primary btn-sm btn-full add-cart-btn" data-id="${p.id}">
                Agregar al carrito
              </button>
              ${isStaff ? `
                <button class="btn btn-secondary btn-sm edit-product-btn" data-id="${p.id}">✏️</button>
                <button class="btn btn-danger btn-sm delete-product-btn" data-id="${p.id}">🗑️</button>
              ` : ''}
            </div>
          </div>
        </article>
      `).join('')

      // Agregar al carrito
      this.querySelectorAll('.add-cart-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const productId = parseInt((btn as HTMLElement).dataset.id ?? '0')
          await this.addToCart(token, productId)
        })
      })

      if (isStaff) {
        // Mostrar/ocultar formulario de edición
        this.querySelectorAll('.edit-product-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = (btn as HTMLElement).dataset.id
            const form = this.querySelector(`#edit-form-${id}`) as HTMLElement
            form.style.display = form.style.display === 'none' ? 'block' : 'none'
          })
        })

        // Cancelar edición
        this.querySelectorAll('.cancel-edit-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = (btn as HTMLElement).dataset.id
            const form = this.querySelector(`#edit-form-${id}`) as HTMLElement
            form.style.display = 'none'
          })
        })

        // Guardar edición
        this.querySelectorAll('.save-edit-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = (btn as HTMLElement).dataset.id
            const form = this.querySelector(`#edit-form-${id}`) as HTMLElement
            const name = (form.querySelector('.edit-name') as HTMLInputElement).value.trim()
            const description = (form.querySelector('.edit-description') as HTMLTextAreaElement).value.trim()
            const price = parseFloat((form.querySelector('.edit-price') as HTMLInputElement).value)
            const stock = parseInt((form.querySelector('.edit-stock') as HTMLInputElement).value)

            if (!name || !description || isNaN(price) || isNaN(stock)) {
              alert('Todos los campos son obligatorios')
              return
            }

            const res = await fetch(`http://localhost:3001/products/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ name, description, price, stock })
            })

            if (res.ok) {
              await this.loadProducts(token, isStaff)
            } else {
              alert('Error al actualizar el producto')
            }
          })
        })

        // Eliminar producto
        this.querySelectorAll('.delete-product-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = (btn as HTMLElement).dataset.id
            if (!confirm('¿Eliminar este producto?')) return

            const res = await fetch(`http://localhost:3001/products/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
              await this.loadProducts(token, isStaff)
            } else {
              alert('Error al eliminar el producto')
            }
          })
        })
      }

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
      alert.className = 'alert alert-success'
      alert.textContent = '✅ Orden procesada correctamente'
      alert.style.display = 'block'
        ; (this.querySelector('#cart-count') as HTMLElement).textContent = '0'
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
